'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Transaction = new Schema({
	transactionid : { type : String, required : true},
	createdat : { type : Date, default : Date.now},
	status : { type : String , default : 'PENDING', required : true}
})

module.exports = mongoose.model('Transaction', Transaction);