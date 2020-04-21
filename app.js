const port = process.env.PORT || 8080

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');

app.use(express.static(path.join(__dirname, '/app/')));
app.set('views', path.join(__dirname, '/app/views'));
app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


var mainRoutes = require('./config/routes/routes')
app.use(mainRoutes);

app.listen(port, () => {
	console.log("Port listening on  http://localhost:"+ port)
}).on('error', console.log);

module.exports = app;
