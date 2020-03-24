var express = require('express');
var path = require('path');
var rootPath = path.join(__dirname, '../../');

var CorridaBs = require('../business/corrida.bs');


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
		var target = parseInt(req.body.id) + 3;
		var tags = Object.keys(result[target].tags).length;
		res.render('corrida-detail', {
			id: target,
			corrida: result[target],
			tags: tags + 1
		})
	});
}


module.exports.checkCorrida = (req, res) => {
		var corrida = new CorridaBs();

		corrida.list((err, result) => {
			if (err) throw console.log("err", err);

			// result[req.body.id].status = "Despachada";

			console.log('result[target] :', result[req.body.id]);
			
			res.render('corrida-check')
		});

}