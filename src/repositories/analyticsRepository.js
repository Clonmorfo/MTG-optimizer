/**
 * ANALYTICS REPOSITORY - Analytics Microservice
 * Gestiona datos de análisis y reportes
 */

const { getPool } = require('../config/database');

const getAnalyticsPool = () => getPool('analytics');

/**
 * Registra actividad del usuario
 */
async function logUserActivity(userId, activityData) {
  try {
    const pool = getAnalyticsPool();
    const { action, resource, metadata } = activityData;
    
    const result = await pool.query(
      `INSERT INTO user_activity (user_id, action, resource, metadata, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [userId, action, resource, JSON.stringify(metadata)]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

/**
 * Obtiene estadísticas de usuario
 */
async function getUserStats(userId) {
  try {
    const pool = getAnalyticsPool();
    const result = await pool.query(
      `SELECT 
        user_id,
        total_logins,
        total_decks_created,
        favorite_colors,
        last_active
       FROM user_stats WHERE user_id = $1`,
      [userId]
    );
    return result.rowCount > 0 ? result.rows[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtiene análisis de meta (cartas más usadas)
 */
async function getMetaAnalysis(format = null) {
  try {
    const pool = getAnalyticsPool();
    const query = format
      ? `SELECT card_id, card_name, usage_count FROM meta_analysis 
         WHERE format = $1 ORDER BY usage_count DESC LIMIT 20`
      : `SELECT card_id, card_name, usage_count FROM meta_analysis 
         ORDER BY usage_count DESC LIMIT 20`;
    
    const result = await pool.query(query, format ? [format] : []);
    return result.rows;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  logUserActivity,
  getUserStats,
  getMetaAnalysis
};
