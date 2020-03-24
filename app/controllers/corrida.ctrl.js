var path = require('path');
var rootPath = path.join(__dirname, '../../');
var fs = require('fs');

var CorridaBs = require('../business/corrida.bs');


// Home page
module.exports.list = (req, res) => {
console.log("ONDE CAI ESSA PORRA????????????????????????????????????");
		if (err) throw console.log("err", err);

		res.render('list')
}


// Home page
module.exports.rootPage = (req, res) =>{
	var corrida = new CorridaBs();

	corrida.list((err, result) => {
		if (err) throw console.log("err", err);

		res.render('list', {
			corrida: result
		})
	});
}	

module.exports.detailPage = (req, res) => { 	
	var corrida = new CorridaBs();

	corrida.list((err, result) => {
		if (err) throw console.log("err", err);
		var target = parseInt(req.body.id) +3;
		var tags = Object.keys(result[target].tags).length;

		res.render('corrida-detail', {
			id: target,
			corrida: result[target],
			tags: tags + 1
		})
		
	});
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
var fileName = rootPath + '/config/database.json';
var corrida = new CorridaBs();

corrida.list((err, result, integerJSON) => {
	if (err) throw console.log("err", err);

	var targetCorrida = parseInt(req.body.id) + 3;
	
	delete integerJSON.corridas[targetCorrida - 4];
	var corrida = result[targetCorrida]

	fs.writeFile(fileName, JSON.stringify(integerJSON), function writeJSON(err) {
		if (err) return console.log(err);
		console.log(JSON.stringify(integerJSON));
		console.log('writing to ' + fileName);
	});

		res.render('corrida-delete', {
				corrida: corrida.nuMCorrida
				})
		});
};

