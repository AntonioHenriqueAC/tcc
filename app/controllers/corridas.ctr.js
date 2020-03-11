var express = require('express');
var CorridaBs = require('../business/corrida.bs');


// var router = express.Router();

// var path = require('path');
// var rootPath = path.join(__dirname, '../../');

// var port = 5000;
// var localhost = 'http://localhost:'+ port +'/';


module.exports.list = (req, res) => {
	var corrida = new CorridaBs();

	corrida.list((err, result) => {
		res.render('list', { corrida: result})
	});


	// corrida.list(req)
	// 	.then(corridas => {
	// 		res.json({
	// 			code: 200,
	// 			data: corridas
	// 		});
	// 	})
	// 	.catch( (err)=>{
 	//  	console.log('err :', err);
	// 	})
}
// var index =  (req, res) => {

// 	// res.sendFile(
// 	// 	path.join(rootPath, 'app/views/list.html')
// 	// );

// 	res.render('list', {
// 		NumCorrida: 124135411212331,
// 		StatusCorrida: "DESPACHADA",
// 		Acc: "92"
// 	})
// };

// // Home page
// var buttonRootPage = router.post('/', (req, res) => {
//  	res.redirect(localhost);
// });

// // Check Corrida
// var detailPage = router.get('/corrida-detail', (req, res) => {
// 	res.sendFile(
// 		path.join(rootPath, 'app/views/corrida-detail.html')
// 	);
// });

// var buttonDetailPage = router.post('/corrida-detail', (req, res) => {
// 	res.sendFile(
// 		path.join(rootPath, 'app/views/corrida-detail.html')
// 	);
// });

// // Check Corrida
// var checkPage = router.get('/corrida-check', (req, res) => {
// 	res.sendFile(
// 		path.join(rootPath, 'app/views/corrida-check.html')
// 	);
// });

// // Check Corrida
// var buttonCheckPage = router.post('/corrida-check', (req, res) => {
// 	res.sendFile(
// 		path.join(rootPath, 'app/views/corrida-check.html')
// 	);
// });


// module.exports = {
// 		// rootPage,
// 		checkPage,
// 		buttonDetailPage,
// 		buttonCheckPage,
// 		detailPage,
// 		buttonRootPage
// 	}