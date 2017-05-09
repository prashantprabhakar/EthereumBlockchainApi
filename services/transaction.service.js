'use strict'

var Transaction = require('./../models/transaction.model'),
	mongoose = require('mongoose');


var TransactionService = function(){

	var _self = this;

	_self.saveTransaction = function(id, cb){
		var transactionID = id;
		Transaction.create({
			transactionid : transactionID,
			status : 'PENDING'
		}, function(err, transaction) {
			console.log("Error : "+err, "Transaction : "+JSON.stringify(transaction));
			if(err) { return cb({error : true, message : err}) };
			return cb({error : false, message : "Transaction Added Successfully"});
		});
	}

	return {
		"saveTransaction" : _self.saveTransaction
	}
}

module.exports = new TransactionService();