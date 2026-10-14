# TS Survivors — Guía del jugador

Sobrevive el mayor tiempo posible contra oleadas de enemigos que no paran de crecer. Tus armas atacan solas: tú solo te mueves, usas la habilidad y eliges mejoras.

## Controles

| Acción | Tecla / ratón |
|---|---|
| Moverte | `W A S D` o flechas |
| Usar habilidad | `Espacio` |
| Elegir héroe | `1`–`4` o clic en la tarjeta |
| Elegir mejora al subir de nivel | `1`–`3` o clic en la tarjeta |
| Volver a elegir héroe tras morir | `R` |

El juego necesita teclado; no hay controles táctiles.

## Cómo se juega

- Los enemigos sueltan **gemas** al morir. Recógelas pasando cerca (rango base: 70 px) para ganar XP.
- Al llenar la barra de XP (arriba) subes de nivel, el juego se pausa y eliges **1 de 3 mejoras** al azar.
- Los enemigos hacen daño por contacto. Tras recibir un golpe tienes **0,5 s de invulnerabilidad**.
- Un enemigo **golpeado y aún vivo** muestra una barra de vida roja sobre su cabeza; si está congelado se ve teñido de azul.
- El HUD muestra tu vida, el progreso de recarga de la habilidad, tu nivel, kills, tiempo y las armas con su nivel.
- Las oleadas son más frecuentes con el tiempo (una cada 1 s al inicio, hasta una cada 0,12 s pasados ~106 s), con un máximo de 300 enemigos a la vez.

## Héroes

| Héroe | Vida | Velocidad | Arma inicial | Habilidad | Extra |
|---|---|---|---|---|---|
| Mage | 100 | 160 | Magic Bolt | Nova | Equilibrado |
| Knight | 140 | 148 | Orbit Blades | Blink Dash | Armadura 1 |
| Cleric | 110 | 155 | Holy Aura | Frost Pulse | Regenera 0,5 HP/s |
| Stormcaller | 80 | 175 | Lightning | Meteor Storm | +10% daño |

## Enemigos

| Enemigo | Aparece | Vida | Velocidad | Daño por contacto | XP |
|---|---|---|---|---|---|
| Bat (murciélago) | Desde el inicio | 6 + 0,1·t | 95 + 0,3·t (máx. +50) | 6 | 1 |
| Skeleton (esqueleto) | Desde los 20 s | 12 + 0,15·t | 55 + 0,4·t (máx. +60) | 8 | 1 |
| Brute (ogro) | Desde los 60 s | 60 + 0,5·t | 38 + 0,15·t (máx. +25) | 16 | 5 |

`t` son los segundos transcurridos. Todos se vuelven más duros con el tiempo.

## Armas (nivel máximo 8)

Daño efectivo = daño base × (1 + 0,3 por nivel adicional) × tu multiplicador de daño. El cooldown se multiplica por tu reducción de cooldown. Puedes tener las cinco armas a la vez.

| Arma | Daño base | Qué hace | Cómo escala |
|---|---|---|---|
| Magic Bolt | 12 | Dispara al enemigo más cercano cada 0,8 s | Proyectiles: 1, 2, 2, 3, 4, 4, 5, 6 según nivel. Desde nivel 3 atraviesa 1 enemigo extra |
| Orbit Blades | 12 | Cuchillas que giran a tu alrededor; empujan 12 px al golpear. Cada enemigo solo recibe un golpe cada 0,35 s | Cuchillas: nivel + 1 (máx. 7). Radio de órbita: 46 + 5·nivel px |
| Holy Aura | 8 | Daña a todos los enemigos dentro del aura cada 0,5 s | Radio: 80 + 12·nivel px |
| Lightning | 25 | Cada 1,6 s cae un rayo sobre enemigos aleatorios a menos de 380 px | Rayos por uso: 1 + ⌊nivel/2⌋ |
| Fire Trail | 6 | Deja llamas en el suelo mientras te mueves; dañan cada 0,4 s | Duración: 2 + 0,4·nivel s. Radio: 18 + 2·nivel px. **Si te quedas quieto no deja llamas** |

## Habilidades (nivel máximo 6, se usan con Espacio)

Cada nivel reduce su cooldown base un 10%. Solo tienes la habilidad de tu héroe y puedes mejorarla.

| Habilidad | Cooldown base | Efecto | Escala por nivel |
|---|---|---|---|
| Nova | 8 s | Onda que daña a todos en 160 px. Daño: 50 | +20 px de radio, +25 de daño |
| Frost Pulse | 10 s | Daña (15) y ralentiza al 30% de velocidad a los enemigos en 200 px durante 2 s | +20 px, +8 de daño, +0,5 s de congelación |
| Blink Dash | 5 s | Saltas 140 px en tu última dirección de movimiento, invulnerable 0,5 s, y dañas (30) lo que cruzas | +20 px, +15 de daño, +0,1 s de invulnerabilidad |
| Meteor Storm | 12 s | 4 meteoros sobre enemigos aleatorios a menos de 450 px; cada uno daña (60) en 60 px | +1 meteoro, +25 de daño |

## Mejoras pasivas

| Mejora | Efecto | Límite |
|---|---|---|
| +15% damage | Multiplica el daño de armas y habilidad | Sin límite |
| -10% cooldowns | Reduce el cooldown de armas y habilidad | Deja de ofrecerse al llegar a ~45% del cooldown original |
| +1 armor | Resta 1 al daño recibido (mínimo 1 por golpe) | Máx. 5 |
| +20 max HP and heal | Sube la vida máxima y te cura por completo | Sin límite |
| Heal 40% HP | Cura el 40% de tu vida máxima | Sin límite |
| +15% move speed | Más velocidad de movimiento | Sin límite |
| +40 pickup range | Recoges gemas desde más lejos | Sin límite |
| +0.5 HP/s regen | Regeneración continua | Sin límite |
| +20% XP gain | Ganas más XP por gema | Sin límite |

Además, cada subida puede ofrecerte **subir de nivel un arma o tu habilidad**, o **una arma nueva** que aún no tengas.

## Consejos

- Las armas de corto alcance (Orbit Blades, Holy Aura, Fire Trail) funcionan mejor cuando los enemigos te rodean; las de rango (Magic Bolt, Lightning) son más seguras al empezar.
- Con Fire Trail conviene moverse en círculos amplios para que los enemigos pisen las llamas.
- Blink Dash te salva de un cerco si lo usas en dirección a un hueco; recuerda que salta hacia donde te estabas moviendo.
- Frost Pulse ayuda a escapar de los Brute, que ya son lentos pero resisten mucho.
- Con 5 de armadura, un Bat (daño 6) solo te quita 1 de vida por golpe; el mínimo por golpe siempre es 1.
- El juego no está equilibrado de forma exhaustiva: algunos héroes y armas se sienten más fuertes que otros.

## Para desarrolladores

- Código fuente: `game.ts` (TypeScript, comentarios Doxygen en español, código en inglés).
- Compilar: `npx tsc game.ts --target ES2020 --lib ES2020,DOM --strict` y cargar el JS en una página con `<canvas id="c">`.
- Estructura OOP: `Entity` (base) → `Enemy` (`Bat`, `Skeleton`, `Brute`), `Gem`, `Projectile`, `Flame`, `Ring`, `Bolt`, `Player`. Composición: `Player` contiene `Weapon[]` (`MagicBolt`, `OrbitBlades`, `HolyAura`, `LightningStrike`, `FireTrail`) y un `Skill` (`Nova`, `FrostPulse`, `BlinkDash`, `MeteorStorm`). Cada héroe es un `HeroDef` con su `HeroPainter`.
