var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Rutas de microservicios
var indexRouter = require('./src/routes/index');
var userAuthRouter = require('./src/routes/authServiceRoute');

var app = express();

// VIEW ENGINE
app.set('view engine', 'ejs');
app.set("views", path.resolve(__dirname, "./src/views"));

// Trust first proxy para uso de rate limiting detrás de un proxy
app.set('trust proxy', 1);

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


// Health check del API Gateway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
