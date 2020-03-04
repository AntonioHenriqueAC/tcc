const port = process.env.PORT || 5000

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(require('./config/routes/routes.js')); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(port).on('error', console.log);

module.exports = app;