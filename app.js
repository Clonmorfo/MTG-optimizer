/**
 * EXPRESS APP - API Gateway
 * Orquesta múltiples microservicios:
 * - Auth (autenticación)
 * - Users (perfil)
 * - Cards (cartas MTG)
 * - Decks (mazos)
 * - Analytics (análisis)
 */

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Rutas de microservicios
var indexRouter = require('./src/routes/index');
var userAuthRouter = require('./src/routes/userAuth');
// var usersRouter = require('./src/routes/users');
// var cardsRouter = require('./src/routes/cards');
// var decksRouter = require('./src/routes/decks');
// var analyticsRouter = require('./src/routes/analytics');

var app = express();

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/', indexRouter);

// Microservicio 1: Auth
app.use('/auth', userAuthRouter);

// Microservicio 2: Users (próximo)
// app.use('/users', usersRouter);

// Microservicio 3: Cards (próximo)
// app.use('/cards', cardsRouter);

// Microservicio 4: Decks (próximo)
// app.use('/decks', decksRouter);

// Microservicio 5: Analytics (próximo)
// app.use('/analytics', analyticsRouter);

// Health check del API Gateway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
