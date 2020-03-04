var express = require('express');
var router = express.Router();

var corridaCtrl = require('../../app/controllers/corrida.ctr');


router.get('/', corridaCtrl.rootPage)
router.get('/corrida-check', corridaCtrl.checkPage)

router.post('/', corridaCtrl.RedPage)



module.exports = router;