var path = require('path');
var rootPath = path.join(__dirname, '../../');
var fs = require('fs');
var CorridaBs = require('../business/corrida.bs');
const util = require('util')

const readDirPromise = util.promisify(fs.readdir);
const renamePromise = util.promisify(fs.rename)


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

module.exports.detailPage = async (req, res) => { 
	var corrida = new CorridaBs(req);

		await callDetailPage();
		async function callDetailPage() {
			let detail = await corrida.list();
			await corrida.groupCorridaDetail(req);
			let data = await corrida.listTags(req);

			const position = req.body.id - 1
			detail = detail[position]
			res.render('corrida-detail',{
				corrida: data,
				tags: data.length,
				detail: detail,
				position: position
			})
		}
}


module.exports.checkCorrida = async (req, res) => {
	
	let corrida = new CorridaBs();
	let targetCorrida = req.body.position;
	let dir = rootPath + 'corridas/config/';

	async function getDirectories(path) {
		const files = await readDirPromise(path);
		const file = parseInt(targetCorrida) 
		let nameFile = files[file];

		return new Promise((resolve) => {
			resolve(path + nameFile);
		})
	}
	const fileName = await getDirectories(dir)

	
	await callCheckCorrida();
	async function callCheckCorrida() {
			let resultFull = await corrida.list();

			result = resultFull[targetCorrida]
			var corridaStatus = result.status;
		
			result.Status = "Despachada"

			fs.writeFile(fileName, JSON.stringify(result), function writeJSON(err) {
				if (err) return console.log(err);
			});

			if (corridaStatus == "Despachada") {
				res.render('corrida-desp');
			} else {
				res.render('corrida-check', {
				corrida: result.nuMCorrida
				})
			}
	}

}

module.exports.deleteCorrida = async (req, res) => {
var corrida = new CorridaBs();

var dir = rootPath + 'corridas/config/';
var dirDelete = rootPath + 'corridas/deleted/';


async function getDirectories(path ) {
	const files = await readDirPromise(path);
	const file = parseInt(req.body.id) - 1
	let nameFile = files[file];

	return new Promise((resolve)=>{
		resolve(path+nameFile);
	})
}

 	const result = await corrida.list()

	let targetCorrida = parseInt(req.body.id) -1;
	let corridaTarget = result[targetCorrida]

	const fileName = await getDirectories(dir)

	let moveFile = async (file, dir2) => {
		let f = path.basename(file);
		let dest = path.resolve(dir2, f);
		await renamePromise(file, dest);
	};

	await moveFile(fileName, dirDelete);

	res.render('corrida-delete', {
			corrida: corridaTarget.nuMCorrida
			})
};

