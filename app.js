var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(require('./config/routes/routes.js')); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(12345);

module.exports = app;