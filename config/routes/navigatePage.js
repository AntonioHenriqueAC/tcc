var express = require('express');
var router = express.Router();

var path = require('path');
var rootPath = path.join(__dirname, '../../');

var port = 5000;
var localhost = 'http://localhost:'+ port +'/';


// Home page
var rootPage = router.get('/', (req, res) => {
	res.sendFile(
		path.join(rootPath, 'app/views/list.html')
	);
});

// Home page
var buttonRootPage = router.post('/', (req, res) => {
 	res.redirect(localhost);
});

// Check Corrida
var detailPage = router.get('/corrida-detail', (req, res) => {
	res.sendFile(
		path.join(rootPath, 'app/views/corrida-detail.html')
	);
});

// Check Corrida
var checkPage = router.get('/corrida-check', (req, res) => {
	res.sendFile(
		path.join(rootPath, 'app/views/corrida-check.html')
	);
});

// Check Corrida
var buttonCheckPage = router.post('/corrida-check', (req, res) => {
	res.sendFile(
		path.join(rootPath, 'app/views/corrida-check.html')
	);
});


// // Button page
// var buttonNext = router.post('/', function (req, res) {
// 	res.redirect(localhost + 'corrida-check');
// });


module.exports = {
		// buttonNext,
		rootPage,
		checkPage,
		buttonCheckPage,
		detailPage,
		buttonRootPage
	}