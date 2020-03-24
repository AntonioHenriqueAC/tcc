var path = require('path');
var rootPath = path.join(__dirname, '../../');
var CorridaBs = require('../business/corrida.bs');
var routes = require(rootPath + 'config/routes/routes');



module.exports.list = (req, res) => {
	var corrida = new CorridaBs();

	corrida.list((err, result) => {
		res.render('list', { 
			corrida: result
		})
		if (err) throw console.log("err", err);
	});
}

// module.exports.detailPage = (req, res) => {

// 		routes.router.get('/corrida-detail', (req, res) => {
// 			res.render('corrida-detail')
// 		});
// }

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
// // 		// rootPage,
// // 		checkPage,
// // 		buttonDetailPage,
// // 		buttonCheckPage,
// // 		detailPage,
// 		buttonRootPage
// 	}