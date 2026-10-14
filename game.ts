/**
 * @file game.ts
 * @brief Survivor-like (estilo Vampire Survivors) con POO en TypeScript.
 *
 * Mantiene la idea de composición del ejemplo en C++: el Player se compone
 * de Weapon[] y un Skill. A diferencia de C++, en TypeScript los objetos se
 * guardan por referencia, lo que permite polimorfismo sin punteros.
 */

/** @brief Vector 2D mínimo. */
interface Vec2 { x: number; y: number; }
/** @brief Opción de mejora mostrada al subir de nivel. */
interface Upgrade { label: string; apply: () => void; }

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
const rand = (a: number, b: number): number => a + Math.random() * (b - a);

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** @class Entity @brief Clase base abstracta de todo objeto del mundo. */
abstract class Entity implements Vec2 {
  alive = true;
  /** @param x Posición X. @param y Posición Y. @param radius Radio de colisión. */
  constructor(public x: number, public y: number, public radius: number) {}
  /** @brief Actualiza la lógica. @param dt Segundos desde el último frame. @param game Juego. */
  abstract update(dt: number, game: Game): void;
  /** @brief Dibuja la entidad. @param ctx Contexto 2D. */
  abstract draw(ctx: CanvasRenderingContext2D): void;
}

/**
 * @class Enemy
 * @brief Base abstracta de enemigos: persigue al jugador, anima y suelta gemas.
 */
abstract class Enemy extends Entity {
  protected age = rand(0, 6);
  protected flash = 0;
  protected dir = 1;
  protected slow = 0;
  protected maxHp: number;
  /** @param radius Radio. @param hp Vida. @param speed Velocidad. @param contactDamage Daño por contacto. @param xpValue XP al morir. */
  constructor(x: number, y: number, radius: number, protected hp: number, protected speed: number, readonly contactDamage: number, private xpValue: number) {
    super(x, y, radius);
    this.maxHp = hp;
  }
  update(dt: number, game: Game): void {
    const p = game.player;
    const d = dist(this, p) || 1;
    this.x += ((p.x - this.x) / d) * this.speed * this.speedMul() * dt;
    this.y += ((p.y - this.y) / d) * this.speed * this.speedMul() * dt;
    this.dir = p.x >= this.x ? 1 : -1;
    this.age += dt;
    this.flash -= dt;
    this.slow -= dt;
  }
  /** @brief Ralentiza al enemigo (velocidad x0.3). @param sec Duración en segundos. */
  freeze(sec: number): void { this.slow = Math.max(this.slow, sec); }
  private speedMul(): number { return this.slow > 0 ? 0.3 : 1; }
  /** @brief Resta vida; si muere suelta una gema. @param amount Daño. @param game Juego. */
  takeDamage(amount: number, game: Game): void {
    this.hp -= amount;
    this.flash = 0.08;
    if (this.hp <= 0 && this.alive) {
      this.alive = false;
      game.kills++;
      game.add(new Gem(this.x, this.y, this.xpValue));
    }
  }
  /** @brief Dibuja el enemigo mirando al jugador; se pone blanco al ser golpeado. */
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.dir, 1);
    this.drawBody(ctx, this.flash > 0);
    if (this.slow > 0) circle(ctx, 0, 0, this.radius, 'rgba(120,200,255,.4)');
    ctx.restore();
    if (this.alive && this.hp < this.maxHp) {
      const w = Math.max(20, this.radius * 2), y = this.y - this.radius - 14;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(this.x - w / 2 - 1, y - 1, w + 2, 6);
      ctx.fillStyle = '#e04848'; ctx.fillRect(this.x - w / 2, y, w * Math.max(0, this.hp / this.maxHp), 4);
    }
  }
  protected abstract drawBody(ctx: CanvasRenderingContext2D, hit: boolean): void;
}

/** @class Bat @brief Murciélago: rápido y frágil, con alas que aletean. */
class Bat extends Enemy {
  constructor(x: number, y: number, t: number) { super(x, y, 9, 6 + t * 0.1, 95 + Math.min(50, t * 0.3), 6, 1); }
  protected drawBody(ctx: CanvasRenderingContext2D, hit: boolean): void {
    const c = hit ? '#fff' : '#6a3d8f', f = Math.sin(this.age * 22);
    ctx.fillStyle = c;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 4, -2); ctx.lineTo(s * 19, -9 - 7 * f); ctx.lineTo(s * 13, 0); ctx.lineTo(s * 16, 7 + 4 * f); ctx.lineTo(s * 5, 4);
      ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 3, -6); ctx.lineTo(s * 6, -13); ctx.lineTo(s * 7, -5); ctx.fill();
    }
    circle(ctx, 0, 0, 8, c);
    circle(ctx, -3, -1, 2, '#ff4d4d'); circle(ctx, 3, -1, 2, '#ff4d4d');
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(-1, 4); ctx.lineTo(-2, 8); ctx.moveTo(1, 4); ctx.lineTo(3, 4); ctx.lineTo(2, 8); ctx.fill();
  }
}

/** @class Skeleton @brief Esqueleto: velocidad y vida medias, camina con rebote. */
class Skeleton extends Enemy {
  constructor(x: number, y: number, t: number) { super(x, y, 11, 12 + t * 0.15, 55 + Math.min(60, t * 0.4), 8, 1); }
  protected drawBody(ctx: CanvasRenderingContext2D, hit: boolean): void {
    const c = hit ? '#fff' : '#e8e4d4', b = Math.sin(this.age * 10) * 1.5;
    ctx.fillStyle = c;
    ctx.fillRect(-5, 1 + b, 10, 10);
    ctx.fillStyle = '#3a3a44';
    for (const y of [4, 7, 10]) ctx.fillRect(-4, y + b, 8, 1.2);
    circle(ctx, 0, -5 + b, 8, c);
    ctx.fillStyle = c; ctx.fillRect(-4, -1 + b, 8, 4);
    circle(ctx, -3, -6 + b, 2.4, '#1b1b22'); circle(ctx, 3, -6 + b, 2.4, '#1b1b22');
    circle(ctx, -3 + 0.8, -6 + b, 1, '#ff5959'); circle(ctx, 3 + 0.8, -6 + b, 1, '#ff5959');
    ctx.fillStyle = '#1b1b22'; ctx.fillRect(-2, 0 + b, 4, 1.4);
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(10, -6 + b, 3, 16);
  }
}

/** @class Brute @brief Ogro: lento, enorme y muy resistente. */
class Brute extends Enemy {
  constructor(x: number, y: number, t: number) { super(x, y, 17, 60 + t * 0.5, 38 + Math.min(25, t * 0.15), 16, 5); }
  protected drawBody(ctx: CanvasRenderingContext2D, hit: boolean): void {
    const c = hit ? '#fff' : '#5c8a3a', b = Math.sin(this.age * 6) * 1.5;
    circle(ctx, 0, 3 + b, 16, c);
    circle(ctx, 0, -9 + b, 9, c);
    ctx.fillStyle = hit ? '#fff' : '#d9d2b0';
    ctx.beginPath(); ctx.moveTo(-7, -15 + b); ctx.lineTo(-10, -24 + b); ctx.lineTo(-3, -17 + b); ctx.moveTo(7, -15 + b); ctx.lineTo(10, -24 + b); ctx.lineTo(3, -17 + b); ctx.fill();
    ctx.strokeStyle = '#1b2a10'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6, -13 + b); ctx.lineTo(-1, -10 + b); ctx.moveTo(6, -13 + b); ctx.lineTo(1, -10 + b); ctx.stroke();
    circle(ctx, -3.5, -9 + b, 1.8, '#ffd23f'); circle(ctx, 3.5, -9 + b, 1.8, '#ffd23f');
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-5, -4 + b); ctx.lineTo(-3, -4 + b); ctx.lineTo(-4, -9 + b); ctx.moveTo(5, -4 + b); ctx.lineTo(3, -4 + b); ctx.lineTo(4, -9 + b); ctx.fill();
    ctx.fillStyle = '#3d5a26'; ctx.fillRect(-9, 8 + b, 18, 3);
  }
}

/** @class Gem @brief Gema de experiencia atraída por el jugador. */
class Gem extends Entity {
  constructor(x: number, y: number, readonly value: number) { super(x, y, 5); }
  update(dt: number, game: Game): void {
    const p = game.player;
    const d = dist(this, p) || 1;
    if (d < p.pickupRange) {
      this.x += ((p.x - this.x) / d) * 420 * dt;
      this.y += ((p.y - this.y) / d) * 420 * dt;
    }
    if (d < p.radius + this.radius) { this.alive = false; p.addXp(this.value, game); }
  }
  draw(ctx: CanvasRenderingContext2D): void { circle(ctx, this.x, this.y, this.radius, '#3dd6d0'); }
}

/** @class Projectile @brief Proyectil con perforación limitada. */
class Projectile extends Entity {
  private life = 2;
  private hit = new Set<Enemy>();
  constructor(x: number, y: number, private vx: number, private vy: number, private damage: number, private pierce: number) {
    super(x, y, 5);
  }
  update(dt: number, game: Game): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) { this.alive = false; return; }
    for (const e of game.enemyList) {
      if (e.alive && !this.hit.has(e) && dist(this, e) < this.radius + e.radius) {
        this.hit.add(e);
        e.takeDamage(this.damage, game);
        if (this.pierce-- <= 0) { this.alive = false; return; }
      }
    }
  }
  draw(ctx: CanvasRenderingContext2D): void { circle(ctx, this.x, this.y, this.radius, '#f4d35e'); }
}

/** @class Ring @brief Efecto visual de onda expansiva (sin daño propio). */
class Ring extends Entity {
  private t = 0;
  constructor(x: number, y: number, private maxR: number, private color = '#9b8cff') { super(x, y, 0); }
  update(dt: number): void {
    this.t += dt;
    this.radius = this.maxR * Math.min(1, this.t / 0.3);
    if (this.t >= 0.3) this.alive = false;
  }
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** @class Bolt @brief Efecto visual de rayo (sin daño propio). */
class Bolt extends Entity {
  private t = 0;
  constructor(x: number, y: number) { super(x, y, 0); }
  update(dt: number): void { this.t += dt; if (this.t > 0.15) this.alive = false; }
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#fff6a8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 220);
    for (let i = 1; i <= 5; i++) ctx.lineTo(this.x + (i < 5 ? rand(-14, 14) : 0), this.y - 220 + i * 44);
    ctx.stroke();
  }
}

/** @class Weapon @brief Arma automática con nivel; daño y cooldown dependen de las stats del dueño. */
abstract class Weapon {
  level = 1;
  readonly maxLevel = 8;
  protected timer = 0;
  /** @param name Nombre. @param baseDamage Daño nivel 1. @param cooldown Segundos entre usos. */
  constructor(readonly name: string, protected baseDamage: number, protected cooldown: number) {}
  /** @brief Daño efectivo (+30% por nivel, multiplicado por el poder del dueño). */
  protected dmg(o: Player): number { return this.baseDamage * (1 + 0.3 * (this.level - 1)) * o.might; }
  /** @brief Cooldown efectivo según la reducción del dueño. */
  protected cd(o: Player): number { return this.cooldown * o.cooldownMult; }
  upgrade(): void { this.level++; }
  abstract update(dt: number, owner: Player, game: Game): void;
  draw(_ctx: CanvasRenderingContext2D, _owner: Player): void {}
}

/** @class MagicBolt @brief Dispara proyectiles al enemigo más cercano. */
class MagicBolt extends Weapon {
  constructor() { super('Magic Bolt', 12, 0.8); }
  update(dt: number, owner: Player, game: Game): void {
    this.timer -= dt;
    if (this.timer > 0) return;
    const target = game.nearestEnemy(owner);
    if (!target) return;
    this.timer = this.cd(owner);
    const base = Math.atan2(target.y - owner.y, target.x - owner.x);
    const n = Math.ceil(this.level / 1.5);
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * 0.15;
      game.add(new Projectile(owner.x, owner.y, Math.cos(a) * 450, Math.sin(a) * 450, this.dmg(owner), this.level >= 3 ? 1 : 0));
    }
  }
}

/**
 * @class OrbitBlades
 * @brief Cuchillas que giran alrededor del jugador y empujan a los enemigos.
 *
 * El radio de órbita es corto para alcanzar a los enemigos pegados al jugador.
 */
class OrbitBlades extends Weapon {
  private angle = 0;
  private lastHit = new Map<Enemy, number>();
  constructor() { super('Orbit Blades', 12, 0.35); }
  private orbit(): number { return 46 + 5 * this.level; }
  private blades(owner: Vec2): { x: number; y: number; a: number }[] {
    const n = Math.min(7, 1 + this.level);
    return Array.from({ length: n }, (_, i) => {
      const a = this.angle + (i * Math.PI * 2) / n;
      return { x: owner.x + Math.cos(a) * this.orbit(), y: owner.y + Math.sin(a) * this.orbit(), a };
    });
  }
  update(dt: number, owner: Player, game: Game): void {
    this.angle += dt * (3 + 0.2 * this.level);
    const blades = this.blades(owner), gap = this.cd(owner);
    for (const e of game.enemyList) {
      if (!e.alive || game.time - (this.lastHit.get(e) ?? -99) < gap) continue;
      if (blades.some(b => dist(b, e) < 14 + e.radius)) {
        this.lastHit.set(e, game.time);
        e.takeDamage(this.dmg(owner), game);
        const d = dist(owner, e) || 1;
        e.x += ((e.x - owner.x) / d) * 12;
        e.y += ((e.y - owner.y) / d) * 12;
      }
    }
    for (const e of this.lastHit.keys()) if (!e.alive) this.lastHit.delete(e);
  }
  draw(ctx: CanvasRenderingContext2D, owner: Player): void {
    for (const b of this.blades(owner)) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.a + Math.PI);
      ctx.fillStyle = '#d0d6e0';
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-6, 6); ctx.lineTo(-6, -6); ctx.fill();
      ctx.fillStyle = '#7a5a2b'; ctx.fillRect(-10, -2, 5, 4);
      ctx.restore();
    }
  }
}

/** @class HolyAura @brief Aura que daña periódicamente a todos los enemigos cercanos. */
class HolyAura extends Weapon {
  private flash = 0;
  constructor() { super('Holy Aura', 8, 0.5); }
  private radius(): number { return 80 + 12 * this.level; }
  update(dt: number, owner: Player, game: Game): void {
    this.flash -= dt;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = this.cd(owner);
    this.flash = 0.15;
    for (const e of game.enemyList) if (e.alive && dist(owner, e) < this.radius() + e.radius) e.takeDamage(this.dmg(owner), game);
  }
  draw(ctx: CanvasRenderingContext2D, owner: Player): void {
    ctx.fillStyle = this.flash > 0 ? 'rgba(255,240,150,.28)' : 'rgba(255,240,150,.10)';
    ctx.beginPath(); ctx.arc(owner.x, owner.y, this.radius(), 0, Math.PI * 2); ctx.fill();
  }
}

/** @class LightningStrike @brief Rayos sobre enemigos aleatorios dentro de un rango. */
class LightningStrike extends Weapon {
  constructor() { super('Lightning', 25, 1.6); }
  update(dt: number, owner: Player, game: Game): void {
    this.timer -= dt;
    if (this.timer > 0) return;
    const pool = game.enemyList.filter(e => e.alive && dist(owner, e) < 380);
    if (pool.length === 0) return;
    this.timer = this.cd(owner);
    for (let i = 0; i < 1 + Math.floor(this.level / 2) && pool.length > 0; i++) {
      const e = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      game.add(new Bolt(e.x, e.y));
      e.takeDamage(this.dmg(owner), game);
    }
  }
}

/** @class Skill @brief Habilidad activa con nivel y cooldown (Template Method: activate). */
abstract class Skill {
  level = 1;
  private timer = 0;
  private total = 1;
  constructor(readonly name: string, protected baseCooldown: number) {}
  /** @brief Cooldown base reducido un 10% por nivel. */
  get cooldown(): number { return this.baseCooldown * Math.pow(0.9, this.level - 1); }
  /** @brief Progreso de recarga entre 0 y 1. */
  get ratio(): number { return 1 - Math.max(0, this.timer) / this.total; }
  upgrade(): void { this.level++; }
  update(dt: number): void { if (this.timer > 0) this.timer -= dt; }
  tryUse(owner: Player, game: Game): void {
    if (this.timer > 0) return;
    this.total = this.timer = this.cooldown * owner.cooldownMult;
    this.activate(owner, game);
  }
  protected abstract activate(owner: Player, game: Game): void;
}

/** @class Nova @brief Daña a todos los enemigos en un radio; crece con el nivel. */
class Nova extends Skill {
  constructor() { super('Nova', 8); }
  protected activate(owner: Player, game: Game): void {
    const radius = 160 + 20 * (this.level - 1), dmg = (50 + 25 * (this.level - 1)) * owner.might;
    game.add(new Ring(owner.x, owner.y, radius));
    for (const e of game.enemyList) if (dist(owner, e) < radius + e.radius) e.takeDamage(dmg, game);
  }
}

/** @class Flame @brief Fuego en el suelo que daña por ticks a los enemigos que lo pisan. */
class Flame extends Entity {
  private tick = 0;
  constructor(x: number, y: number, r: number, private damage: number, private life: number) { super(x, y, r); }
  update(dt: number, game: Game): void {
    this.life -= dt;
    if (this.life <= 0) { this.alive = false; return; }
    this.tick -= dt;
    if (this.tick > 0) return;
    this.tick = 0.4;
    for (const e of game.enemyList) if (e.alive && dist(this, e) < this.radius + e.radius) e.takeDamage(this.damage, game);
  }
  draw(ctx: CanvasRenderingContext2D): void {
    circle(ctx, this.x, this.y, this.radius, 'rgba(255,110,30,.35)');
    circle(ctx, this.x, this.y, this.radius * 0.5, 'rgba(255,220,90,.55)');
  }
}

/** @class FireTrail @brief Deja llamas detrás del jugador mientras se mueve. */
class FireTrail extends Weapon {
  private last: Vec2 = { x: 1e9, y: 1e9 };
  constructor() { super('Fire Trail', 6, 0.35); }
  update(dt: number, owner: Player, game: Game): void {
    this.timer -= dt;
    if (this.timer > 0 || dist(owner, this.last) < 22) return;
    this.timer = this.cd(owner);
    this.last = { x: owner.x, y: owner.y };
    game.add(new Flame(owner.x, owner.y, 18 + 2 * this.level, this.dmg(owner), 2 + 0.4 * this.level));
  }
}

/** @class FrostPulse @brief Daña y ralentiza a los enemigos cercanos. */
class FrostPulse extends Skill {
  constructor() { super('Frost Pulse', 10); }
  protected activate(owner: Player, game: Game): void {
    const L = this.level - 1, radius = 200 + 20 * L, dmg = (15 + 8 * L) * owner.might;
    game.add(new Ring(owner.x, owner.y, radius, '#8fd8ff'));
    for (const e of game.enemyList) if (dist(owner, e) < radius + e.radius) { e.freeze(2 + 0.5 * L); e.takeDamage(dmg, game); }
  }
}

/** @class BlinkDash @brief Salto en la dirección de movimiento: invulnerable y daña lo que cruza. */
class BlinkDash extends Skill {
  constructor() { super('Blink Dash', 5); }
  protected activate(owner: Player, game: Game): void {
    const L = this.level - 1, d = 140 + 20 * L, dmg = (30 + 15 * L) * owner.might, sx = owner.x, sy = owner.y;
    owner.x += owner.aim.x * d;
    owner.y += owner.aim.y * d;
    owner.invuln = 0.5 + 0.1 * L;
    for (const e of game.enemyList) {
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        if (dist({ x: sx + (owner.x - sx) * t, y: sy + (owner.y - sy) * t }, e) < 40 + e.radius) { e.takeDamage(dmg, game); break; }
      }
    }
    game.add(new Ring(owner.x, owner.y, 50, '#7fe0ff'));
  }
}

/** @class MeteorStorm @brief Lluvia de meteoros sobre enemigos al azar (área de 60 px cada uno). */
class MeteorStorm extends Skill {
  constructor() { super('Meteor Storm', 12); }
  protected activate(owner: Player, game: Game): void {
    const L = this.level - 1, dmg = (60 + 25 * L) * owner.might;
    const pool = game.enemyList.filter(e => e.alive && dist(owner, e) < 450);
    for (let i = 0; i < 4 + L; i++) {
      const t: Vec2 = pool.length ? pool[Math.floor(Math.random() * pool.length)] : { x: owner.x + rand(-200, 200), y: owner.y + rand(-200, 200) };
      const c = { x: t.x, y: t.y };
      game.add(new Ring(c.x, c.y, 60, '#ff8a3d'));
      for (const e of game.enemyList) if (e.alive && dist(c, e) < 60 + e.radius) e.takeDamage(dmg, game);
    }
  }
}

/** @brief Define cómo se dibuja un héroe (orientado a la derecha, origen en el centro). */
interface HeroPainter { draw(ctx: CanvasRenderingContext2D, bob: number): void; }
/** @brief Datos de un héroe seleccionable. */
interface HeroDef {
  name: string; desc: string; maxHp: number; speed: number; might: number; armor: number; regen: number;
  weapon: () => Weapon; skill: () => Skill; painter: HeroPainter;
}

function shadow(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(0, 13, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
}

/** @class Player @brief Héroe jugable compuesto por armas y una habilidad, con stats pasivas. */
class Player extends Entity {
  hp: number; maxHp: number; xp = 0; xpNext = 5; level = 1;
  speed: number; pickupRange = 70;
  /** @brief Multiplicadores y bonos pasivos. */
  might: number; cooldownMult = 1; armor: number; regen: number; xpMult = 1;
  invuln = 0;
  aim: Vec2 = { x: 1, y: 0 };
  private facing = 1;
  private walk = 0;
  private moving = false;
  readonly weapons: Weapon[];
  readonly skill: Skill;
  /** @param hero Definición del héroe elegido. */
  constructor(readonly hero: HeroDef) {
    super(0, 0, 12);
    this.hp = this.maxHp = hero.maxHp;
    this.speed = hero.speed; this.might = hero.might; this.armor = hero.armor; this.regen = hero.regen;
    this.weapons = [hero.weapon()];
    this.skill = hero.skill();
  }
  update(dt: number, game: Game): void {
    const k = game.input;
    const dx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    const dy = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
    const len = Math.hypot(dx, dy) || 1;
    this.x += (dx / len) * this.speed * dt;
    this.y += (dy / len) * this.speed * dt;
    this.moving = dx !== 0 || dy !== 0;
    if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
    if (this.moving) { this.aim = { x: dx / len, y: dy / len }; this.walk += dt; }
    this.invuln -= dt;
    this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
    for (const w of this.weapons) w.update(dt, this, game);
    this.skill.update(dt);
    if (k.has('Space')) this.skill.tryUse(this, game);
    if (this.invuln > 0) return;
    for (const e of game.enemyList) {
      if (e.alive && dist(this, e) < this.radius + e.radius) { this.takeDamage(e.contactDamage, game); break; }
    }
  }
  /** @brief Recibe daño reducido por la armadura (mínimo 1). */
  takeDamage(n: number, game: Game): void {
    this.hp = Math.max(0, this.hp - Math.max(1, n - this.armor));
    this.invuln = 0.5;
    if (this.hp === 0) { this.alive = false; game.state = 'dead'; }
  }
  /** @brief Suma experiencia (con bono) y sube de nivel. */
  addXp(v: number, game: Game): void {
    this.xp += v * this.xpMult;
    if (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Math.ceil(this.xpNext * 1.4) + 2;
      game.openLevelUp();
    }
  }
  /** @brief Dibuja armas y luego el héroe con su pintor; parpadea al ser invulnerable. */
  draw(ctx: CanvasRenderingContext2D): void {
    for (const w of this.weapons) w.draw(ctx, this);
    if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);
    this.hero.painter.draw(ctx, this.moving ? Math.sin(this.walk * 12) * 1.5 : 0);
    ctx.restore();
  }
}

/** @class WizardPainter @brief Mago: sombrero puntiagudo, barba y bastón. */
class WizardPainter implements HeroPainter {
  draw(ctx: CanvasRenderingContext2D, bob: number): void {
    shadow(ctx);
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(10, -14, 3, 27);
    circle(ctx, 11.5, -16, 4, '#ffd966');
    ctx.translate(0, bob);
    ctx.fillStyle = '#3b6fd4';
    ctx.beginPath(); ctx.moveTo(-10, 13); ctx.lineTo(10, 13); ctx.lineTo(6, -4); ctx.lineTo(-6, -4); ctx.fill();
    ctx.fillStyle = '#e0b84a'; ctx.fillRect(-7, 3, 14, 2.5);
    circle(ctx, 0, -9, 6, '#f1c9a0');
    ctx.fillStyle = '#eee';
    ctx.beginPath(); ctx.moveTo(-5, -7); ctx.lineTo(5, -7); ctx.lineTo(0, 5); ctx.fill();
    circle(ctx, -1.5, -10, 1.3, '#222'); circle(ctx, 3.5, -10, 1.3, '#222');
    ctx.fillStyle = '#5b3fb5';
    ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(12, -12); ctx.lineTo(4, -31); ctx.fill();
    ctx.fillStyle = '#e0b84a'; ctx.fillRect(-7, -15, 14, 2);
  }
}

/** @class KnightPainter @brief Caballero: armadura, yelmo con penacho, espada y escudo. */
class KnightPainter implements HeroPainter {
  draw(ctx: CanvasRenderingContext2D, bob: number): void {
    shadow(ctx);
    ctx.fillStyle = '#cfd5df'; ctx.fillRect(11, -18, 3, 22);
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(8, 3, 9, 3);
    ctx.translate(0, bob);
    ctx.fillStyle = '#8a94a8'; ctx.fillRect(-8, -4, 16, 17);
    ctx.fillStyle = '#5d6679'; ctx.fillRect(-8, 8, 16, 3);
    ctx.fillStyle = '#3b6fd4'; ctx.fillRect(-13, -3, 7, 14);
    ctx.fillStyle = '#e0b84a'; ctx.fillRect(-11, 1, 3, 6);
    circle(ctx, 0, -10, 7.5, '#aab3c4');
    ctx.fillStyle = '#1b1f2a'; ctx.fillRect(-1, -12, 8, 3);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.moveTo(-2, -17); ctx.lineTo(-13, -20); ctx.lineTo(-5, -11); ctx.fill();
  }
}

/** @class ClericPainter @brief Clérigo: túnica blanca con cruz, capucha, halo y maza. */
class ClericPainter implements HeroPainter {
  draw(ctx: CanvasRenderingContext2D, bob: number): void {
    shadow(ctx);
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(10, -8, 3, 21);
    circle(ctx, 11.5, -10, 4.5, '#e0b84a');
    ctx.translate(0, bob);
    ctx.fillStyle = '#eae6d8';
    ctx.beginPath(); ctx.moveTo(-11, 13); ctx.lineTo(11, 13); ctx.lineTo(6, -4); ctx.lineTo(-6, -4); ctx.fill();
    ctx.fillStyle = '#e0b84a'; ctx.fillRect(-1, 0, 2, 9); ctx.fillRect(-3.5, 3, 7, 2);
    circle(ctx, 0, -9, 6, '#f1c9a0');
    ctx.fillStyle = '#d6d0bd';
    ctx.beginPath(); ctx.arc(0, -10, 7.5, Math.PI, 0); ctx.fill();
    circle(ctx, -1.5, -9, 1.3, '#222'); circle(ctx, 3.5, -9, 1.3, '#222');
    ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -22, 7, 2.5, 0, 0, Math.PI * 2); ctx.stroke();
  }
}

/** @class StormPainter @brief Invocador de tormentas: capa oscura, pelo en picos y chispa flotante. */
class StormPainter implements HeroPainter {
  draw(ctx: CanvasRenderingContext2D, bob: number): void {
    shadow(ctx);
    circle(ctx, 13, -8 + Math.sin(Date.now() / 150) * 2, 3.5, '#ffe96b');
    ctx.translate(0, bob);
    ctx.fillStyle = '#2c2f5a';
    ctx.beginPath(); ctx.moveTo(-11, 13); ctx.lineTo(10, 13); ctx.lineTo(7, -4); ctx.lineTo(-7, -4); ctx.fill();
    ctx.fillStyle = '#ffe96b';
    ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(-3, 6); ctx.lineTo(0, 6); ctx.lineTo(-1, 11); ctx.lineTo(4, 3); ctx.lineTo(1, 3); ctx.fill();
    circle(ctx, 0, -9, 6, '#e8b98f');
    ctx.beginPath(); ctx.moveTo(-6, -11); ctx.lineTo(-8, -20); ctx.lineTo(-3, -15); ctx.lineTo(0, -23); ctx.lineTo(3, -15); ctx.lineTo(8, -20); ctx.lineTo(6, -11); ctx.fill();
    circle(ctx, -1.5, -9, 1.3, '#222'); circle(ctx, 3.5, -9, 1.3, '#222');
  }
}

/** @brief Héroes seleccionables al iniciar o tras morir. */
const HEROES: HeroDef[] = [
  { name: 'Mage', desc: 'Balanced, ranged bolts', maxHp: 100, speed: 160, might: 1, armor: 0, regen: 0, weapon: () => new MagicBolt(), skill: () => new Nova(), painter: new WizardPainter() },
  { name: 'Knight', desc: 'Tanky, armored, slower', maxHp: 140, speed: 148, might: 1, armor: 1, regen: 0, weapon: () => new OrbitBlades(), skill: () => new BlinkDash(), painter: new KnightPainter() },
  { name: 'Cleric', desc: 'Regenerates, slows crowds', maxHp: 110, speed: 155, might: 1, armor: 0, regen: 0.5, weapon: () => new HolyAura(), skill: () => new FrostPulse(), painter: new ClericPainter() },
  { name: 'Stormcaller', desc: 'Fast, fragile, hits hard', maxHp: 80, speed: 175, might: 1.1, armor: 0, regen: 0, weapon: () => new LightningStrike(), skill: () => new MeteorStorm(), painter: new StormPainter() },
];

/** @class Game @brief Bucle principal, entrada, spawn y HUD. */
class Game {
  entities: Entity[] = [];
  enemyList: Enemy[] = [];
  player!: Player;
  time = 0;
  kills = 0;
  state: 'select' | 'playing' | 'levelup' | 'dead' = 'select';
  readonly input = new Set<string>();
  private options: Upgrade[] = [];
  private spawnTimer = 0;
  private last = 0;

  constructor(private canvas: HTMLCanvasElement, private ctx: CanvasRenderingContext2D) {
    const resize = (): void => { canvas.width = innerWidth; canvas.height = innerHeight; };
    resize();
    addEventListener('resize', resize);
    addEventListener('keydown', e => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      this.input.add(e.code);
      if (this.state === 'levelup') {
        const i = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
        if (i >= 0) this.pick(i);
      } else if (this.state === 'select') {
        const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
        if (i >= 0) this.reset(HEROES[i]);
      } else if (this.state === 'dead' && e.code === 'KeyR') this.state = 'select';
    });
    addEventListener('keyup', e => this.input.delete(e.code));
    canvas.addEventListener('click', e => {
      const n = this.state === 'select' ? HEROES.length : this.state === 'levelup' ? this.options.length : 0;
      for (let i = 0; i < n; i++) {
        const r = this.cardRect(i, n);
        if (e.offsetX >= r.x && e.offsetX <= r.x + r.w && e.offsetY >= r.y && e.offsetY <= r.y + r.h) {
          if (this.state === 'select') this.reset(HEROES[i]); else this.pick(i);
          return;
        }
      }
    });
    requestAnimationFrame(this.frame);
  }

  /** @brief Reinicia la partida con el héroe elegido. @param hero Héroe. */
  reset(hero: HeroDef): void {
    this.entities = []; this.enemyList = []; this.time = 0; this.kills = 0; this.spawnTimer = 0; this.state = 'playing';
    this.player = new Player(hero);
  }
  add(e: Entity): void { this.entities.push(e); }
  nearestEnemy(from: Vec2): Enemy | null {
    let best: Enemy | null = null, bd = Infinity;
    for (const e of this.enemyList) { const d = dist(from, e); if (e.alive && d < bd) { bd = d; best = e; } }
    return best;
  }

  /** @brief Pausa el juego y ofrece 3 mejoras aleatorias (armas, habilidad o pasivas). */
  openLevelUp(): void {
    const p = this.player, pool: Upgrade[] = [];
    for (const w of p.weapons) if (w.level < w.maxLevel) pool.push({ label: `${w.name} -> Lv ${w.level + 1}`, apply: () => w.upgrade() });
    for (const make of [() => new MagicBolt(), () => new OrbitBlades(), () => new HolyAura(), () => new LightningStrike(), () => new FireTrail()]) {
      const w = make();
      if (!p.weapons.some(o => o.name === w.name)) pool.push({ label: `New: ${w.name}`, apply: () => p.weapons.push(w) });
    }
    if (p.skill.level < 6) pool.push({ label: `${p.skill.name} -> Lv ${p.skill.level + 1}`, apply: () => p.skill.upgrade() });
    if (p.cooldownMult > 0.45) pool.push({ label: '-10% cooldowns', apply: () => { p.cooldownMult *= 0.9; } });
    if (p.armor < 5) pool.push({ label: '+1 armor', apply: () => { p.armor += 1; } });
    pool.push(
      { label: '+20 max HP and heal', apply: () => { p.maxHp += 20; p.hp = p.maxHp; } },
      { label: 'Heal 40% HP', apply: () => { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.4); } },
      { label: '+15% damage', apply: () => { p.might += 0.15; } },
      { label: '+15% move speed', apply: () => { p.speed *= 1.15; } },
      { label: '+40 pickup range', apply: () => { p.pickupRange += 40; } },
      { label: '+0.5 HP/s regen', apply: () => { p.regen += 0.5; } },
      { label: '+20% XP gain', apply: () => { p.xpMult += 0.2; } },
    );
    pool.sort(() => Math.random() - 0.5);
    this.options = pool.slice(0, 3);
    this.state = 'levelup';
  }
  private pick(i: number): void {
    if (!this.options[i]) return;
    this.options[i].apply();
    this.state = 'playing';
  }
  private cardRect(i: number, n = this.options.length): { x: number; y: number; w: number; h: number } {
    const gap = 16, w = Math.min(220, (this.canvas.width - 32 - gap * (n - 1)) / n), total = n * w + (n - 1) * gap;
    const h = this.state === 'select' ? 250 : 120;
    return { x: (this.canvas.width - total) / 2 + i * (w + gap), y: this.canvas.height / 2 - h / 2, w, h };
  }

  private spawn(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0 || this.enemyList.length >= 300) return;
    this.spawnTimer = Math.max(0.12, 1 - this.time / 120);
    const a = rand(0, Math.PI * 2), r = Math.max(this.canvas.width, this.canvas.height) / 2 + 40, t = this.time, roll = Math.random();
    const Kind: new (x: number, y: number, t: number) => Enemy = t > 60 && roll < 0.1 ? Brute : t > 20 && roll < 0.45 ? Skeleton : Bat;
    this.add(new Kind(this.player.x + Math.cos(a) * r, this.player.y + Math.sin(a) * r, t));
  }

  /** @brief Separación suave entre enemigos para que rodeen al jugador en vez de apilarse. */
  private separate(): void {
    const en = this.enemyList;
    for (let i = 0; i < en.length; i++) {
      for (let j = i + 1; j < en.length; j++) {
        const a = en[i], b = en[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy), m = a.radius + b.radius;
        if (d === 0) { a.x += 0.1; continue; }
        if (d < m) { const f = ((m - d) / (2 * d)) * 0.5; a.x += dx * f; a.y += dy * f; b.x -= dx * f; b.y -= dy * f; }
      }
    }
  }

  private update(dt: number): void {
    if (this.state !== 'playing') return;
    this.time += dt;
    this.enemyList = this.entities.filter((e): e is Enemy => e instanceof Enemy);
    this.spawn(dt);
    this.separate();
    this.player.update(dt, this);
    for (const e of this.entities) e.update(dt, this);
    this.entities = this.entities.filter(e => e.alive);
  }

  private draw(): void {
    const { ctx, canvas, player: p } = this;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#14161c';
    ctx.fillRect(0, 0, W, H);
    if (this.state === 'select') { this.drawSelect(W, H); return; }
    ctx.save();
    ctx.translate(W / 2 - p.x, H / 2 - p.y);
    ctx.strokeStyle = '#1f2330';
    ctx.lineWidth = 1;
    const g = 64, x0 = Math.floor((p.x - W / 2) / g) * g, y0 = Math.floor((p.y - H / 2) / g) * g;
    ctx.beginPath();
    for (let x = x0; x < p.x + W / 2 + g; x += g) { ctx.moveTo(x, p.y - H / 2 - g); ctx.lineTo(x, p.y + H / 2 + g); }
    for (let y = y0; y < p.y + H / 2 + g; y += g) { ctx.moveTo(p.x - W / 2 - g, y); ctx.lineTo(p.x + W / 2 + g, y); }
    ctx.stroke();
    for (const e of this.entities) e.draw(ctx);
    p.draw(ctx);
    ctx.restore();
    this.drawHud(W, H);
  }

  /** @brief Pantalla de selección de héroe. */
  private drawSelect(W: number, H: number): void {
    const { ctx } = this;
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '26px sans-serif';
    ctx.fillText('Choose your hero (click or keys 1-4)', W / 2, 60);
    HEROES.forEach((h, i) => {
      const r = this.cardRect(i, HEROES.length);
      ctx.fillStyle = '#232838'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#4aa3ff'; ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.save(); ctx.translate(r.x + r.w / 2, r.y + 85); ctx.scale(2.2, 2.2); h.painter.draw(ctx, 0); ctx.restore();
      ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif'; ctx.fillText(`${i + 1}. ${h.name}`, r.x + r.w / 2, r.y + 135, r.w - 12);
      ctx.fillStyle = '#aab'; ctx.font = '13px sans-serif';
      [`HP ${h.maxHp}   Speed ${h.speed}`, h.weapon().name, `${h.skill().name} [Space]`, h.desc].forEach((t, k) => ctx.fillText(t, r.x + r.w / 2, r.y + 160 + k * 20, r.w - 12));
    });
    ctx.fillStyle = '#aab'; ctx.fillText('WASD / arrows: move   |   Space: skill   |   weapons fire automatically', W / 2, H - 40);
  }

  private drawHud(W: number, H: number): void {
    const { ctx, player: p } = this;
    ctx.fillStyle = '#2a2f3d'; ctx.fillRect(0, 0, W, 10);
    ctx.fillStyle = '#3dd6d0'; ctx.fillRect(0, 0, W * (p.xp / p.xpNext), 10);
    ctx.fillStyle = '#2a2f3d'; ctx.fillRect(12, 20, 200, 14);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(12, 20, 200 * (p.hp / p.maxHp), 14);
    ctx.fillStyle = '#2a2f3d'; ctx.fillRect(12, 40, 200, 8);
    ctx.fillStyle = '#9b8cff'; ctx.fillRect(12, 40, 200 * p.skill.ratio, 8);
    ctx.fillStyle = '#e8e8ee'; ctx.font = '14px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Lv ${p.level}   Kills ${this.kills}   ${p.skill.name} [Space]`, 12, 66);
    ctx.fillText(p.weapons.map(w => `${w.name} ${w.level}`).join(' | '), 12, 86);
    const s = Math.floor(this.time);
    ctx.textAlign = 'right';
    ctx.fillText(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, W - 12, 30);
    ctx.textAlign = 'center';
    if (this.state === 'levelup') {
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = '22px sans-serif';
      ctx.fillText('Level up: choose one (click or keys 1-3)', W / 2, H / 2 - 90);
      this.options.forEach((o, i) => {
        const r = this.cardRect(i);
        ctx.fillStyle = '#232838'; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = '#4aa3ff'; ctx.strokeRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
        ctx.fillText(`${i + 1}. ${o.label}`, r.x + r.w / 2, r.y + r.h / 2 + 5, r.w - 16);
      });
    } else if (this.state === 'dead') {
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = '28px sans-serif';
      ctx.fillText(`You died at ${s}s with ${this.kills} kills. Press R to choose a hero.`, W / 2, H / 2);
    }
  }

  private frame = (t: number): void => {
    const dt = Math.min(0.05, (t - this.last) / 1000);
    this.last = t;
    this.update(dt);
    this.draw();
    requestAnimationFrame(this.frame);
  };
}

const canvas = document.getElementById('c') as HTMLCanvasElement;
new Game(canvas, canvas.getContext('2d')!);
