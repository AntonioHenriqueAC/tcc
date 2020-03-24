var express = require('express');
var router = express.Router();

var corrida = require('../../app/controllers/corrida.ctrl');

router.get('/', corrida.rootPage)
router.post('/', corrida.rootPage)
router.post('/corrida-detail', corrida.detailPage)
router.post('/corrida-check', corrida.checkCorrida)
router.post('/corrida-delete', corrida.deleteCorrida)

module.exports = router;