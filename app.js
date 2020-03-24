const port = process.env.PORT || 1111

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');

app.use(express.static(path.join(__dirname, 'app')));
app.set('views', path.join(__dirname, '/app/views'));
app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(require('./config/routes/routes.js')); 

app.listen(port).on('error', console.log);

module.exports = app;