'use strict'


var express = require('express'),
	router = express.Router(),
	controller = require('./api.controller');


router.post('/checkEthBalance', controller.checkEthBalance);
router.post('/checkCoinBalance', controller.checkCoinBalance);
router.post('/transferCoin',controller.transferCoin);
router.post('/transferEther',controller.transferEther);
router.post('/checkTransactionStatus', controller.checkTransactionStatus);
router.post('/createNewAccount', controller.createNewAccount);
//router.post('/sayMyName',controller.sayMyName);
//router.post('/printAllTransactions', controller.printAllTransactions);
//router.post('/multiply',controller.multiply);
//router.post('/watchTransaction',controller.watchTransaction);
module.exports = router;
