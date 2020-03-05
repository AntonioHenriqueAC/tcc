var express = require('express');
var router = express.Router();

var navigate = require('../../config/routes/navigatePage');


router.get('/', navigate.rootPage)
router.post('/', navigate.buttonRootPage)
router.get('/corrida-check', navigate.checkPage)
router.post('/corrida-check', navigate.buttonCheckPage)
router.get('/corrida-detail', navigate.detailPage)
// router.post('/', navigate.buttonNext)



module.exports = router;