 'use strict';

var fs = require('fs');
var path = require('path');
var rootPath = path.join(__dirname, '../../');
// var Promise = require('bluebird');

function Corrida(req){
	this.req = req;
}


Corrida.prototype.list = (callback) => {

	 fs.readFile(rootPath + '/config/database.json', 'utf8', (err, result) => {
		 var data = [];
	    var i = 0
		 if (err) throw console.log("err: ", err);
		
		 var obj = JSON.parse(result);
		 var integerJSON = obj;


		obj.forEach(function (corrida) { 
			var tag = JSON.stringify(corrida.numCorrida);
			var nuMCorrida = '';
			
			for (let i = 0; i < tag.length; i++) {
				if((i>2) && (i<11)){
					nuMCorrida += tag[i]
				}
			}

			if (i >= 0) {
				obj[i].nuMCorrida = nuMCorrida;
				data = obj;
				i++
			}
		});
		
		callback(err, data, integerJSON);
		});
};


Corrida.prototype.listHome = () => {

	// make Promise version of fs.readdir()
	fs.readdirAsync = function (dirname) { 
		return new Promise(function (resolve, reject) {
			fs.readdir(dirname, function (err, filenames) {
				if (err)
					reject(err);
				else
					resolve(filenames);
			});
		});
	};

	// make Promise version of fs.readFile()
	fs.readFileAsync = function (filename, enc) {
		return new Promise(function (resolve, reject) {
			fs.readFile(filename, enc, function (err, data) {
				if (err)
					reject(err);
				else
					resolve(data);
			});
		});
	};

	// utility function, return Promise
	function getFile(filename) {
		return fs.readFileAsync(rootPath +'/corridas/config/'+filename, 'utf8');
	}

	// example of using promised version of getFile
	// getFile(rootPath + '/corridas/config/config_1.json', 'utf8').then(function (data) {
	// console.log(data);
	// });


	// a function specific to my project to filter out the files I need to read and process, you can pretty much ignore or write your own filter function.
	function isDataFile(filename) {
		return (filename.split('.')[1] == 'json' &&
			filename.split('.')[0] != 'fishes' &&
			filename.split('.')[0] != 'fishes_backup')
	}

	// start a blank fishes.json file
	fs.writeFile(rootPath + '/config/database.json', '', function () {
		// console.log('done')
	});


	// read all json files in the directory, filter out those needed to process, and using Promise.all to time when all async readFiles has completed. 
	fs.readdirAsync(rootPath + '/corridas/config').then(function (filenames) {
			filenames = filenames.filter(isDataFile);
   		// console.log('filenames :', filenames);
			return Promise.all(filenames.map(getFile));
		}).then(function (files) {
				var summaryFiles = [];
				var i = 0;
				files.forEach(function (file) {
					var json_file = JSON.parse(file);
					i++;
					summaryFiles.push({
						"id": i,
						"numCorrida": json_file["numCorrida"],
						"status": json_file["Status"],
						"acc": json_file["acc"],
						"qte": json_file["qte"]
					});
				});
				fs.appendFile(rootPath + '/config/database.json', JSON.stringify(summaryFiles, null, 4), function (err) {
					if (err) {
						return console.log(err);
					}
					// console.log("The file was appended!");
				});
			}).catch(err =>{
		 			if (err) throw console.log("err", err);
			});

	return Promise.resolve(true);
};


Corrida.prototype.groupCorridaDetail = (req) => {

	var target = parseInt(req.body.id);
	var targetDir = rootPath + 'corridas/Corrida_' + target + '/tags_json/'
	var targetDirCorrida = rootPath + 'corridas/Corrida_' + target + '/'
		
		// make Promise version of fs.readdir()
		fs.readdirAsync = function (dirname) {
			return new Promise(function (resolve, reject) {
				fs.readdir(dirname, function (err, filenames) {
					if (err)
						reject(err);
					else
						resolve(filenames);
				});
			});
		};

		// make Promise version of fs.readFile()
		fs.readFileAsync = function (filename, enc) {
			return new Promise(function (resolve, reject) {
				fs.readFile(filename, enc, function (err, data) {
					if (err)
						reject(err);
					else
						resolve(data);
				});
			});
		};

		// utility function, return Promise
		function getFile(filename) {
			return fs.readFileAsync(targetDir + filename, 'utf8');
		}

		// example of using promised version of getFile
		// getFile('tag-000.json', 'utf8').then(function (data) {
		// console.log(data);
		// });


		// a function specific to my project to filter out the files I need to read and process, you can pretty much ignore or write your own filter function.
		function isDataFile(filename) {
			return (filename.split('.')[1] == 'json' &&
				filename.split('.')[0] != 'fishes' &&
				filename.split('.')[0] != 'fishes_backup')
		}

		// start a blank fishes.json file
		fs.writeFile(targetDirCorrida +'database.json', '', function () {
			// console.log('done')
		});


		// read all json files in the directory, filter out those needed to process, and using Promise.all to time when all async readFiles has completed. 
		fs.readdirAsync(targetDir).then(function (filenames) {
			filenames = filenames.filter(isDataFile);
			// console.log('filenames :', filenames);
			return Promise.all(filenames.map(getFile));
		}).then(function (files) {
			var summaryFiles = [];
			files.forEach(function (file) {
				var json_file = JSON.parse(file);
				summaryFiles.push({
					"config": json_file[0]
				});
			});
			fs.appendFile(targetDirCorrida + 'database.json', JSON.stringify(summaryFiles, null, 4), function (err) {
				if (err) {
					return console.log(err);
				}
				console.log("The file was appended!");
			});
		}).catch(err => {
			if (err) throw console.log("err", err);
		});

	return Promise.resolve(true);

};


Corrida.prototype.listTags = (req) => {
var target = parseInt(req.body.id);
console.log('target :', target);

fs.readFile(rootPath + '/corridas/Corrida_'+target+'/database.json', 'utf8', (err, result) => {
	if (err) throw console.log("err: ", err);
	var data = [];
	var i = 0

	var json = result;
	json = JSON.parse(JSON.stringify(json).split('"_id":').join('"id":'));

	result = document.write(JSON.stringify(json));

	
	// var obj = JSON.parse(result);
	 
	// console.log('obj :', obj);

	// var integerJSON = obj;


	// obj.forEach(function (corrida) {
	// 	var tag = JSON.stringify(corrida.numCorrida);
	// 	var nuMCorrida = '';

	// 	for (let i = 0; i < tag.length; i++) {
	// 		if ((i > 2) && (i < 11)) {
	// 			nuMCorrida += tag[i]
	// 		}
	// 	}

	// 	if (i >= 0) {
	// 		obj[i].nuMCorrida = nuMCorrida;
	// 		data = obj;
	// 		i++
	// 	}
	// });

	// callback(err, data, integerJSON);
});

}


module.exports = Corrida;
