var fs = require('fs');
var path = require('path');
var rootPath = path.join(__dirname, '../../');

function Corrida(){}


Corrida.prototype.list = (callback) => {

 fs.readFile(rootPath + '/config/database.json', 'utf8', (err, result) => {
	 var data = [];
	 
	if (err) throw err;

	var obj = JSON.parse(result);
	console.log('obj.length :', Object.keys(obj.corridas).length);

if (Object.keys(obj.corridas).length > 4) {
		var i = 4;
	} else {
		var i = (Object.keys(obj.corridas).length - 1);
	}
	
	obj.corridas.forEach(function (corrida) {
 console.log('corrida :', corrida);
		corrida = JSON.stringify(corrida)
 corrida = JSON.parse(corrida);


  console.log('corridaaaaaaaaaaaa :', corrida);
		if (i >= 0) {
			data[i] = corrida;
		i++
		}
	});

 	callback(err, data);
 });
 };


module.exports = Corrida;
