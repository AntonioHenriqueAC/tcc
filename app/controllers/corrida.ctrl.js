var path = require('path');
var rootPath = path.join(__dirname, '../../');
var fs = require('fs');
// var Promise = require('bluebird');
var CorridaBs = require('../business/corrida.bs');


module.exports.list = (req, res) =>{
	var corrida = new CorridaBs();

	callListPage()
	async function callListPage() {
		 await listHome();
		 await list();
	}

	async function listHome() {
		await sleep(0);
		return corrida.listHome();
	}

	async function list() {
		await sleep(5);
		return corrida.list((err, result) => {
				res.render('list', {
					corrida: result
				})
			})
	}

	function sleep(ms = 0) {
		return new Promise(r => setTimeout(r, ms));
	}


}	

module.exports.detailPage = (req, res) => { 
	var corrida = new CorridaBs(req);

		callDetailPage()
		async function callDetailPage() {
			await groupCorridaDetail(req);
			await listTags(req);
		}

		async function groupCorridaDetail(req) {
			await sleep(0);
			return corrida.groupCorridaDetail(req);
		}

		async function listTags(req) {
			await sleep(15);
			return corrida.listTags(req);
		}

		function sleep(ms = 0) {
			return new Promise(r => setTimeout(r, ms));
		}

	// corrida.groupCorridaDetail(req)
	// 	.then(() => { 
	// 		corrida.listTags(req);
	// 	}).catch(err =>{
	// 		console.log(err)
	// 	})

}


module.exports.checkCorrida = (req, res) => {
	var fileName = rootPath + '/config/database.json';
	var corrida = new CorridaBs();

	corrida.list((err, result, integerJSON) => {
		if (err) throw console.log("err", err);

		var targetCorrida = req.body.id;
		var corrida = result[targetCorrida]
		var corridaStatus = corrida.status;
		
		integerJSON.corridas[targetCorrida - 4].status = "Despachada"

		fs.writeFile(fileName, JSON.stringify(integerJSON), function writeJSON(err) {
			if (err) return console.log(err);
			console.log(JSON.stringify(integerJSON));
			console.log('writing to ' + fileName);
		});

		if (corridaStatus == "Despachada") {
			res.render('corrida-desp');
		} else {
			res.render('corrida-check', {
			corrida: corrida.nuMCorrida
		})
}

	});

}

module.exports.deleteCorrida = (req, res) => {
var corrida = new CorridaBs();

var dir = rootPath + 'corridas/config/';

function getDirectories(path, callback) {
	fs.readdir(path, function (err, files) {
		if (err) return callback(err)
		file = parseInt(req.body.id) - 1
		let nameFile = files[file];
		return callback(null, nameFile)
	})
}


corrida.list((err, result, integerJSON) => {
	if (err) throw console.log("err", err);

	var targetCorrida = parseInt(req.body.id) -1;
 	console.log('targetCorrida :', targetCorrida);
	
	var corrida = result[targetCorrida]
 	console.log('corrida :', corrida);

	getDirectories(dir, function (err, content) {
		if (err) throw console.log(err)
		console.log(content)
	});


	// var moveFile = (file, dir2) => {
	// 	var f = path.basename(file);
	// 	var dest = path.resolve(dir2, f);

	// 	fs.rename(file, dest, (err) => {
	// 		if (err) throw err;
	// 		else console.log('Successfully moved');
	// 	});
	// };

	// moveFile(fileName, dir);

	res.render('corrida-delete', {
			corrida: corrida.nuMCorrida
			})
	});
};

