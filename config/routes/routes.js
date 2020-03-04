var express = require('express');
var router = express.Router();

var navigate = require('../../config/routes/navigatePage');


router.get('/', navigate.rootPage)
router.get('/corrida-check', navigate.checkPage)
router.post('/', navigate.buttonNext)



module.exports = router;