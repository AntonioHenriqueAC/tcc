var express = require('express');
var router = express.Router();

var corridaCtrl = require('../../app/controllers/corrida.ctrl');

router.post('/py', corridaCtrl.buttonPy)
router.get('/', corridaCtrl.list)
router.post('/', corridaCtrl.list)
router.post('/corrida-detail', corridaCtrl.detailPage)
router.post('/corrida-check', corridaCtrl.checkCorrida)
router.post('/corrida-delete', corridaCtrl.deleteCorrida)
router.post('/show-image', corridaCtrl.showImage)
router.post('/edit-image', corridaCtrl.editImage)

module.exports = router;