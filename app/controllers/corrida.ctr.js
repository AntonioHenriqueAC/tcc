var CorridaBs = require('../business/corrida.bs');
var Routes = require('../../config/routes/routes');
var path = require('path');
var rootPath = path.join(__dirname, '..', '..');
var express = require('express');
var router = express.Router();

const fs = require('fs');

var localhost = 'http://localhost:12345/';


// Methodos GET
var rootPage = router.get('/', (req, res) => {
	res.sendFile(
		path.join(rootPath, 'app/views/list.html')
	);
});

var checkPage = router.get('/corrida-check', (req, res) => {
	res.sendFile(
		path.join(rootPath, 'app/views/corrida-check.html')
	);
});


// Metodos POST
var RedPage = router.post('/', function (req, res) {
	res.redirect(localhost + 'corrida-check');
});






module.exports = {
	rootPage,
	checkPage,
	RedPage
}

// module.exports = corridaCtrl;
