 'use strict';

const util = require('util')
var fs = require('fs');
var path = require('path');
var rootPath = path.join(__dirname, '../../');
const appendFilePromise = util.promisify(fs.appendFile)
const writeFilePromise = util.promisify(fs.writeFile)
const readFilePromise = util.promisify(fs.readFile)

function Corrida(req){
	this.req = req;
}


Corrida.prototype.list = async () => {

	const result = await readFilePromise(rootPath + '/config/database.json', 'utf8')

	let data = [];
	let i = 0

	let obj = JSON.parse(result);

	const mapPromise = obj.map(function (corrida) {
		let tag = JSON.stringify(corrida.numCorrida);
		let nuMCorrida = '';
		let first2 = tag[1] + tag[2];

		for (let i = 0; i < tag.length; i++) {
			if((i>2) && (i<9)){
				nuMCorrida += tag[i]
			}
		}
		if (first2 == 28){
			nuMCorrida = 2 + nuMCorrida
		}else{
			nuMCorrida += 1 + nuMCorrida
		}

		if (i >= 0) {
			obj[i].nuMCorrida = nuMCorrida;
			data = obj;
			i++
		}
	});
		
	await Promise.all(mapPromise);
	return data
};


Corrida.prototype.listHome = async () => {

	// make Promise version of fs.readdir()
	const readdirAsync = function (dirname) { 
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
	const readFileAsync = function (filename, enc) {
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
		return readFileAsync(rootPath + 'server/corridas_config/config/' + filename, 'utf8');
	}

	// example of using promised version of getFile
	// getFile(rootPath + '/corridas_config/config/config_1.json', 'utf8').then(function (data) {
	// console.log(data);
	// });


	// a function specific to my project to filter out the files I need to read and process, you can pretty much ignore or write your own filter function.
	function isDataFile(filename) {
		return (filename.split('.')[1] == 'json' &&
			filename.split('.')[0] != 'fishes' &&
			filename.split('.')[0] != 'fishes_backup')
	}

	// start a blank fishes.json file
	await writeFilePromise(rootPath + '/config/database.json', '');
	
	return new Promise(async (resolve, reject) => {
		// read all json files in the directory, filter out those needed to process, and using Promise.all to time when all async readFiles has completed. 
		let filenames = await readdirAsync(rootPath + 'server/corridas_config/config')
		filenames = filenames.filter(isDataFile);
		let files = await Promise.all(filenames.map(getFile));

		var summaryFiles = [];

		files.forEach(function (file) {
			var json_file = JSON.parse(file);
			summaryFiles.push({
				"numCorrida": json_file["numCorrida"],
				"status": json_file["Status"],
				"acc": json_file["acc"],
				"qte": json_file["qte"]
			 });
			});

	 await appendFilePromise(rootPath + '/config/database.json', JSON.stringify(summaryFiles, null, 4))
	 resolve()
	})

};


Corrida.prototype.groupCorridaDetail = async (req) => {

var target = parseInt(req.body.id);
var targetDir = rootPath + 'server/corridas/Corrida_' + target + '/tags_json/'
var targetDirCorrida = rootPath + 'server/corridas/Corrida_' + target + '/'

// make Promise version of fs.readdir()
const readdirAsync = function (dirname) {
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
const readFileAsync = function (filename, enc) {
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
	return readFileAsync(targetDir + filename, 'utf8');
}



// a function specific to my project to filter out the files I need to read and process, you can pretty much ignore or write your own filter function.
function isDataFile(filename) {
	return (filename.split('.')[1] == 'json' &&
		filename.split('.')[0] != 'fishes' &&
		filename.split('.')[0] != 'fishes_backup')
}

await writeFilePromise(targetDirCorrida + 'database.json', '');


return new Promise(async (resolve, reject) => {
let filenames = await readdirAsync(targetDir)
filenames = filenames.filter(isDataFile);
let files = await Promise.all(filenames.map(getFile));

let summaryFiles = [];

files.forEach(function (file) {
	let json_file = JSON.parse(file);
	summaryFiles.push({
			"config": json_file[0]
			});
});

await appendFilePromise(targetDirCorrida + 'database.json', JSON.stringify(summaryFiles, null, 4));
resolve()
})

};


Corrida.prototype.listTags = async (req) => {
var target = parseInt(req.body.id);
path = rootPath + 'server/corridas/Corrida_' + target + '/database.json'

let result = await readFilePromise(path, 'utf8');

let data = [];
let i = 0

result = JSON.parse(result);

const mapPromise = result.map( (corrida) => {
	if (i >= 0) {
		data[i] = corrida.config;
		i++
	}
});

await Promise.all(mapPromise);
return data
}



module.exports = Corrida;
