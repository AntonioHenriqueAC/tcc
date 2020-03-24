var fs = require('fs');
var path = require('path');
var rootPath = path.join(__dirname, '../../');

function Corrida(){}


Corrida.prototype.list = (callback) => {

 fs.readFile(rootPath + '/config/database.json', 'utf8', (err, result) => {
	 var data = [];
	 
	if (err) throw err;

	var obj = JSON.parse(result);

if (Object.keys(obj.corridas).length > 4) {
		var i = 4;
	} else {
		var i = (Object.keys(obj.corridas).length - 1);
	}

	obj.corridas.forEach(function (corrida) { 
		var tag = JSON.stringify(corrida.tags);
		var nuMCorrida = '';

		for (let i = 0; i < tag.length; i++) {
			if((i>7) && (i<16)){
				nuMCorrida += tag[i]
			}
		}

		if (i >= 0) {
			corrida.nuMCorrida = nuMCorrida;
			data[i] = corrida;
			i++
		}
	});
	
	
 	callback(err, data);
 });
 };

Corrida.prototype.update = (callback) => {

 fs.writeFile(rootPath + '/config/database.json', 'utf8', (err, result) => {
	 var data = [];
	 
	if (err) throw err;

	var obj = JSON.parse(result);

if (Object.keys(obj.corridas).length > 4) {
		var i = 4;
	} else {
		var i = (Object.keys(obj.corridas).length - 1);
	}

	obj.corridas.forEach(function (corrida) { 
		var tag = JSON.stringify(corrida.tags);
		var nuMCorrida = '';

		for (let i = 0; i < tag.length; i++) {
			if((i>7) && (i<16)){
				nuMCorrida += tag[i]
			}
		}

		if (i >= 0) {
			corrida.nuMCorrida = nuMCorrida;
			data[i] = corrida;
			i++
		}
	});
	
	
 	callback(err, data);
 });
 };


module.exports = Corrida;
