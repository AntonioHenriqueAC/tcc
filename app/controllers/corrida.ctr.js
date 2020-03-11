var express = require('express');

var CorridaBs = require('../business/corrida.bs');
var Routes = require('../../config/routes/routes');


exports.list = function(rootPage, req, res){
	var listCorrida = new rootPage.app.bs.list();

	listCorrida.getCorridas(function(err, result){
		res.render("list", {news: result})
	})

};




module.exports = { }
