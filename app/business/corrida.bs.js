'use strict';
var path = require('path');
var rootPath = path.join(__dirname, '..', '..');
const fs = require('fs');

var database = fs.readFile(rootPath + '/config/database.json', (err, data) => {
	if (err) throw err;
	let student = JSON.parse(data);
	console.log(student);

});


module.exports = {
	database
};
