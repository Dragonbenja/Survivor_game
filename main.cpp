/**
 * @file main.cpp
 * @brief Ejemplo de composición en C++: un personaje compuesto por un arma y una habilidad.
 */

#include <iostream>
#include <string>
#include <utility>

// ============================================
// WEAPON
// ============================================

/**
 * @class Weapon
 * @brief Representa un arma con un nombre y un daño base.
 */
class Weapon
{
public:
    /**
     * @brief Constructor del arma.
     * @param name Nombre del arma.
     * @param damage Puntos de daño que inflige el arma.
     */
    Weapon(std::string name, int damage)
        : name_(std::move(name)), damage_(damage) {}

    /**
     * @brief Ejecuta un ataque con el arma e imprime el resultado por consola.
     */
    void attack() const
    {
        std::cout << "⚔️ Ataque con " << name_ << ": "
                  << damage_ << " puntos de daño\n";
    }

    /**
     * @brief Obtiene el daño del arma.
     * @return Puntos de daño del arma.
     */
    int getDamage() const { return damage_; }

    /**
     * @brief Obtiene el nombre del arma.
     * @return Referencia constante al nombre del arma.
     */
    const std::string& getName() const { return name_; }

private:
    std::string name_; ///< Nombre del arma.
    int damage_;       ///< Daño que inflige el arma.
};

// ============================================
// SKILL
// ============================================

/**
 * @class Skill
 * @brief Representa una habilidad con un nombre y un poder.
 */
class Skill
{
public:
    /**
     * @brief Constructor de la habilidad.
     * @param name Nombre de la habilidad.
     * @param power Puntos de poder de la habilidad.
     */
    Skill(std::string name, int power)
        : name_(std::move(name)), power_(power) {}

    /**
     * @brief Utiliza la habilidad e imprime el resultado por consola.
     */
    void use() const
    {
        std::cout << "✨ Se utiliza " << name_ << ": "
                  << power_ << " puntos de poder\n";
    }

    /**
     * @brief Obtiene el nombre de la habilidad.
     * @return Referencia constante al nombre de la habilidad.
     */
    const std::string& getName() const { return name_; }

private:
    std::string name_; ///< Nombre de la habilidad.
    int power_;        ///< Poder de la habilidad.
};

// ============================================
// CHARACTER
// ============================================

/**
 * @class Character
 * @brief Personaje compuesto por un arma y una habilidad.
 *
 * Usa composición por valor: cada personaje posee su propia copia
 * del arma y de la habilidad.
 */
class Character
{
public:
    /**
     * @brief Constructor del personaje.
     * @param name Nombre del personaje.
     * @param health Vida inicial.
     * @param weapon Arma inicial (se copia).
     * @param skill Habilidad inicial (se copia).
     */
    Character(std::string name, int health, Weapon weapon, Skill skill)
        : name_(std::move(name)),
          health_(health),
          weapon_(std::move(weapon)),
          skill_(std::move(skill)) {}

    /**
     * @brief Ataca utilizando el arma equipada.
     */
    void attack() const
    {
        std::cout << name_ << " ataca:\n";
        weapon_.attack();
    }

    /**
     * @brief Utiliza la habilidad del personaje.
     */
    void useSkill() const
    {
        std::cout << name_ << " utiliza una habilidad:\n";
        skill_.use();
    }

    /**
     * @brief Reemplaza el arma equipada.
     * @param newWeapon Nueva arma (se copia).
     */
    void changeWeapon(Weapon newWeapon)
    {
        weapon_ = std::move(newWeapon);
        std::cout << name_ << " ahora utiliza " << weapon_.getName() << "\n";
    }

    /**
     * @brief Resta vida al personaje.
     * @param damage Puntos de daño recibidos.
     */
    void takeDamage(int damage)
    {
        health_ -= damage;
        std::cout << name_ << " recibió " << damage << " puntos de daño.\n";
        std::cout << "Vida restante: " << health_ << "\n";
    }

private:
    std::string name_; ///< Nombre del personaje.
    int health_;       ///< Vida actual.
    Weapon weapon_;    ///< Arma equipada.
    Skill skill_;      ///< Habilidad del personaje.
};

// ============================================
// MAIN
// ============================================

/**
 * @brief Punto de entrada: crea armas, habilidades y personajes, y simula una partida.
 * @return 0 si la ejecución fue correcta.
 */
int main()
{
    // Armas
    const Weapon sword("Espada de fuego", 30);
    const Weapon bow("Arco mágico", 20);

    // Habilidades
    const Skill healing("Curación", 25);
    const Skill shield("Escudo mágico", 15);

    // Composición
    Character warrior("Guerrero", 100, sword, healing);

    warrior.attack();
    warrior.useSkill();
    warrior.takeDamage(20);

    // Cambio de arma
    warrior.changeWeapon(bow);
    warrior.attack();

    // Otro personaje
    Character archer("Arquero", 80, bow, shield);

    archer.attack();
    archer.useSkill();

    return 0;
}
