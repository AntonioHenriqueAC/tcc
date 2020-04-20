var path = require('path');
var rootPath = path.join(__dirname, '../../');
var fs = require('fs');
var CorridaBs = require('../business/corrida.bs');
const image2base64 = require('image-to-base64');
const util = require('util')
var multer = require('multer');

const readDirPromise = util.promisify(fs.readdir);
const renamePromise = util.promisify(fs.rename)
const readFilePromise = util.promisify(fs.readFile)


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
	let dir = rootPath + 'server/corridas/config/';

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

var dir = rootPath + 'server/corridas/config/';
var dirDelete = rootPath + 'server/corridas/deleted/';


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


module.exports.showImage = async (req, res) => {
	target = req.body.id - 1
	position = parseInt(req.body.position) + 1


	if (target >= 0 && target < 10) target = '00' + target
	if (target > 9 && target < 100) target = '0' + target

	var path = rootPath + "server/corridas/Corrida_" + position + "/tags_images/barcode-00" + target + ".jpg"
	var numCorrida = rootPath + "server/corridas/Corrida_" + position + "/tags_json/tag-" + target + ".json"
	
	const img = await image2base64(path);
	let result = await readFilePromise(numCorrida, 'utf8');
	result = JSON.parse(result);
	numCorrida = result[0].num

	res.render('show-image', {
		id: target,
		img: img, 
		numCorrida: numCorrida,
		position: position
	})
}

module.exports.editImage = async (req, res) => {
	var corrida = new CorridaBs(req);
	
	var numCorrida = rootPath + "server/corridas/Corrida_" + req.body.id + "/tags_json/tag-" + req.body.target + ".json"
	
	let result = await readFilePromise(numCorrida, 'utf8');
	result = JSON.parse(result);
	result[0].num = req.body.num
	
	
	fs.writeFile(numCorrida, JSON.stringify(result), function writeJSON(err) {
		if (err) return console.log(err);
	});
	
	
	await callDetailPage();
	async function callDetailPage() {
		let detail = await corrida.list();
		await corrida.groupCorridaDetail(req);
		let data = await corrida.listTags(req);
		
		const position = req.body.id - 1
		detail = detail[position]
		res.render('corrida-detail', {
			corrida: data,
			tags: data.length,
			detail: detail,
			position: position
		})
	}
}

module.exports.scriptPy = async (req, res) => {
const path = rootPath + "server/images"
const filesLenght = await readDirPromise(path);

var storage = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, './server/images');
	},
	filename: function (req, file, callback) {
		callback(null, file.fieldname + (filesLenght.length + 1) + '.jpg');
	}
});

var upload = multer({storage: storage}).single('img');

upload(req, res, function (err) {
	if (err) {
			return res.end("Error uploading file.");
		}
	});

let runPy = new Promise(function (success, nosuccess) {

	const spawn = require("child_process").spawn;
	const pyprog = spawn('python', [rootPath + '/recognize.py']);

	pyprog.stderr.on('data', function (data) {
		success(data);
	});

	pyprog.stdout.on('data', (data) => {
		nosuccess(data);
	});
});

runPy.then(function (fromRunpy) {
	res.redirect("/")
});


}