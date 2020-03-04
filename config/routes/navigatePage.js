var express = require('express');
var router = express.Router();
var path = require('path');
var rootPath = path.join(__dirname, '../../');

var localhost = 'http://localhost:12345/';


// Home page
var rootPage =router.get('/', (req, res) => {
	res.sendFile(
		path.join(rootPath, 'app/views/list.html')
	);
});

// Check Corrida
var checkPage = router.get('/corrida-check', (req, res) => {
	res.sendFile(
		path.join(rootPath, 'app/views/corrida-check.html')
	);
});


// Button page
var buttonNext = router.post('/', function (req, res) {
	res.redirect(localhost + 'corrida-check');
});


module.exports = {
		buttonNext,
		rootPage,
		checkPage
	}