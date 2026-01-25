/**
 * CONFIGURACIÓN CENTRALIZADA DE BASES DE DATOS
 * Soporta múltiples microservicios con sus propias BDs
 */

require('dotenv').config();
const { Pool } = require('pg');

// Configuración por microservicio
const dbConfigs = {
  // Microservicio 1: Autenticación
  auth: {
    host: process.env.DB_AUTH_HOST || process.env.DB_HOST,
    port: process.env.DB_AUTH_PORT || process.env.DB_PORT,
    user: process.env.DB_AUTH_USER || process.env.DB_USER,
    password: process.env.DB_AUTH_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DB_AUTH_NAME || process.env.DB_NAME,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },

  // Microservicio 2: Usuarios/Perfil
  users: {
    host: process.env.DB_USERS_HOST || process.env.DB_HOST,
    port: process.env.DB_USERS_PORT || process.env.DB_PORT,
    user: process.env.DB_USERS_USER || process.env.DB_USER,
    password: process.env.DB_USERS_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DB_USERS_NAME || 'mtg_users',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },

  // Microservicio 3: Cartas/Inventario
  cards: {
    host: process.env.DB_CARDS_HOST || process.env.DB_HOST,
    port: process.env.DB_CARDS_PORT || process.env.DB_PORT,
    user: process.env.DB_CARDS_USER || process.env.DB_USER,
    password: process.env.DB_CARDS_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DB_CARDS_NAME || 'mtg_cards',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },

  // Microservicio 4: Decks
  decks: {
    host: process.env.DB_DECKS_HOST || process.env.DB_HOST,
    port: process.env.DB_DECKS_PORT || process.env.DB_PORT,
    user: process.env.DB_DECKS_USER || process.env.DB_USER,
    password: process.env.DB_DECKS_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DB_DECKS_NAME || 'mtg_decks',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },

  // Microservicio 5: Análisis/Reportes
  analytics: {
    host: process.env.DB_ANALYTICS_HOST || process.env.DB_HOST,
    port: process.env.DB_ANALYTICS_PORT || process.env.DB_PORT,
    user: process.env.DB_ANALYTICS_USER || process.env.DB_USER,
    password: process.env.DB_ANALYTICS_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DB_ANALYTICS_NAME || 'mtg_analytics',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  }
};

// Pool de conexiones por microservicio
const pools = {};

/**
 * Obtiene el pool de conexiones para un microservicio
 * @param {string} service - Nombre del microservicio (auth, users, cards, decks, analytics)
 * @returns {Pool} Pool de conexiones
 */
function getPool(service = 'auth') {
  if (!pools[service]) {
    if (!dbConfigs[service]) {
      throw new Error(`Microservicio desconocido: ${service}`);
    }
    pools[service] = new Pool(dbConfigs[service]);
    
    // Event listeners para debugging
    pools[service].on('error', (err) => {
      console.error(`Pool de ${service} error no esperado:`, err);
    });

    pools[service].on('connect', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`✓ Conectado a BD: ${dbConfigs[service].database}`);
      }
    });
  }
  return pools[service];
}

/**
 * Cierra todas las conexiones
 */
async function closeAllPools() {
  const services = Object.keys(pools);
  for (const service of services) {
    await pools[service].end();
    console.log(`Pool de ${service} cerrado`);
  }
}

module.exports = {
  getPool,
  closeAllPools,
  dbConfigs
};
