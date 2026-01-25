/**
 * CARDS REPOSITORY - Cards Microservice
 * Gestiona datos de cartas MTG
 */

const { getPool } = require('../config/database');

const getCardsPool = () => getPool('cards');

/**
 * Obtiene tarjeta por ID
 */
async function getCardById(cardId) {
  try {
    const pool = getCardsPool();
    const result = await pool.query(
      `SELECT id, name, mana_cost, type, rarity, colors, power, toughness
       FROM mtg_cards WHERE id = $1`,
      [cardId]
    );
    return result.rowCount > 0 ? result.rows[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Busca cartas por nombre
 */
async function searchCardsByName(name) {
  try {
    const pool = getCardsPool();
    const result = await pool.query(
      `SELECT id, name, mana_cost, type, rarity FROM mtg_cards 
       WHERE name ILIKE $1 LIMIT 20`,
      [`%${name}%`]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtiene cartas por color
 */
async function getCardsByColor(color) {
  try {
    const pool = getCardsPool();
    const result = await pool.query(
      `SELECT id, name, mana_cost, type FROM mtg_cards 
       WHERE colors CONTAINS $1 LIMIT 50`,
      [color]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getCardById,
  searchCardsByName,
  getCardsByColor
};
