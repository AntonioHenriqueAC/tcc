var fs = require('fs');
var path = require('path');
var rootPath = path.join(__dirname, '../../');

function Corrida(){}


Corrida.prototype.list = (callback) => {

 fs.readFile(rootPath + '/config/database.json', 'utf8', (err, result) => {
	 var data = [];
	 
	 if (err) throw err;
	 
	 var obj = JSON.parse(result);
	 var integerJSON = obj;
	var numeroCorridas = Object.keys(obj.corridas).length;

	 for (let i = 0; i < numeroCorridas; i++) {
		 if ((obj.corridas[i] == null) || (obj.corridas[i] == undefined) ) {
			 delete obj.corridas[i];
			}
		}

		
		if (Object.keys(obj.corridas).length > 4) {
				var i = 4;
			} else {
				var i = (Object.keys(obj.corridas).length - 1);
			}

	obj.corridas.forEach(function (corrida) { 
		var tag = JSON.stringify(corrida.tags);
		var nuMCorrida = '';

		for (let i = 0; i < tag.length; i++) {
			if((i>6) && (i<15)){
				nuMCorrida += tag[i]
			}
		}

		if (i >= 0) {
			corrida.nuMCorrida = nuMCorrida;
			data[i] = corrida;
			i++
		}
	});
	
	
 	callback(err, data, integerJSON);
 });
 };

module.exports = Corrida;
