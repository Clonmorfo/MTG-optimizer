/**
 * DECKS REPOSITORY - Decks Microservice
 * Gestiona datos de decks (mazos)
 */

const { getPool } = require('../config/database');

const getDecksPool = () => getPool('decks');

/**
 * Crea un nuevo deck
 */
async function createDeck(userId, deckData) {
  try {
    const pool = getDecksPool();
    const { name, description, format, colors } = deckData;
    
    const result = await pool.query(
      `INSERT INTO decks (user_id, name, description, format, colors, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, user_id, name, description, format, colors, created_at`,
      [userId, name, description, format, colors]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

/**
 * Obtiene decks de un usuario
 */
async function getDecksByUserId(userId) {
  try {
    const pool = getDecksPool();
    const result = await pool.query(
      `SELECT id, user_id, name, description, format, colors, created_at, updated_at
       FROM decks WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtiene un deck por ID
 */
async function getDeckById(deckId, userId) {
  try {
    const pool = getDecksPool();
    const result = await pool.query(
      `SELECT id, user_id, name, description, format, colors, created_at, updated_at
       FROM decks WHERE id = $1 AND user_id = $2`,
      [deckId, userId]
    );
    return result.rowCount > 0 ? result.rows[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Agrega carta a un deck
 */
async function addCardToDeck(deckId, cardId, quantity) {
  try {
    const pool = getDecksPool();
    const result = await pool.query(
      `INSERT INTO deck_cards (deck_id, card_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (deck_id, card_id) DO UPDATE SET quantity = $3
       RETURNING *`,
      [deckId, cardId, quantity]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createDeck,
  getDecksByUserId,
  getDeckById,
  addCardToDeck
};
