var path = require('path');
var rootPath = path.join(__dirname, '../../');
var fs = require('fs');
var CorridaBs = require('../business/corrida.bs');
const util = require('util')


module.exports.list = async (req, res) =>{
	var corrida = new CorridaBs();

	await callListPage();
	async function callListPage() {
		await corrida.listHome();
		const data = await corrida.list();
			res.render('list', {
				corrida: data
			})
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
var dirDelete = rootPath + 'corridas/deleted/';


const readDirPromise = util.promisify(fs.readdir);
async function getDirectories(path ) {
	const files = await readDirPromise(path);
	const file = parseInt(req.body.id) - 1
	let nameFile = files[file];

	return new Promise((resolve)=>{
		resolve(path+nameFile);
	})
}


corrida.list(async (err, result, integerJSON) => {
	if (err) throw console.log("err", err);

	var targetCorrida = parseInt(req.body.id) -1;
 	console.log('targetCorrida :', targetCorrida);
	
	var corrida = result[targetCorrida]

	const fileName = await getDirectories(dir)
 console.log('fileName :', fileName);

	var moveFile = async (file, dir2) => {
		var f = path.basename(file);
		var dest = path.resolve(dir2, f);
		const renamePromise = util.promisify(fs.rename)
		await renamePromise(file, dest);
	};

	await moveFile(fileName, dirDelete);

	res.render('corrida-delete', {
			corrida: corrida.nuMCorrida
			})
	});
};

