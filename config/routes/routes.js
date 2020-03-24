var express = require('express');
var router = express.Router();

var corrida = require('../../app/controllers/corridas.ctr');
var buttons = require('../../app/controllers/button.ctrl');

router.get('/', corrida.list);
// router.get('/corrida-detail', corrida.detailPage)


router.post('/', buttons.rootPage)
router.post('/corrida-detail', buttons.detailPage)
router.post('/corrida-check', buttons.checkCorrida)
// router.post('/corrida-check', corrida.buttonCheckPage)
// router.post('/', corrida.buttonNext)



module.exports = router;