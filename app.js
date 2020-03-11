const port = process.env.PORT || 5000

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');

app.use(express.static(path.join(__dirname, 'app')));
app.set('views', path.join(__dirname, '/app/views'));
app.set('view engine', 'ejs');


app.use(require('./config/routes/routes.js')); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(port).on('error', console.log);

module.exports = app;