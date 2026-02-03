var express = require('express');
var router = express.Router();
const authController = require('../controllers/authServiceController');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

module.exports = router;
