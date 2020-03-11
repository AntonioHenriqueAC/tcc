var express = require('express');
var router = express.Router();

var corrida = require('../../app/controllers/corridas.ctr');

router.get('/', corrida.list)

// router.post('/', corrida.buttonRootPage)
// router.get('/corrida-check', corrida.checkPage)
// router.post('/corrida-check', corrida.buttonCheckPage)
// router.get('/corrida-detail', corrida.detailPage)
// router.post('/corrida-detail', corrida.buttonDetailPage)
// router.post('/', corrida.buttonNext)



module.exports = router;