'use strict'

var contract = require('./contractDetails');


var web3_extended = require('web3_extended');
var path = require('path');
var absolutePath =  path.relative('./','/home/pr.singh/.ethereum/geth.ipc');
var TransactionService = require('./../services/transaction.service');
var Transaction = require('./../models/transaction.model');
console.log(absolutePath);
var options = {
  //host : absolutePath,	
  host: ' http://localhost:8012',
  ipc : false,
  personal: true, 
  admin: false,
  debug: false
};

var web3 = web3_extended.create(options);

var contractAddress= "0x43C3d9220AbAF159323bFD4aB746a52527a2D17e";

exports.checkEthBalance = function(req, res) {
	console.log("check balanace");
	console.log(req.body);
	var accountAddr = req.body.accountAddress;
	//var accountAddr = "0x62720366ef403c9891e2bfbd5358ee3c8a57b113";
	if(isAddress(accountAddr)==false){
		console.log("This address is not valid");
		//return res.json({error:true ,  message: "Invalid address"});
		return res.json({"success":"false","data":[{"message":"Inavlid address"}]});

	}
	var ethBalance=web3.eth.getBalance(accountAddr).toNumber(); 
	return res.json({"success":"true","data":[{"balance": ethBalance}]});
	//return res.json({error:"false", balance: ethBalanceethBalance, message:"Success"});
	console.log(ethBalance);
}


// this is just giving "Invalid address" response of address is wrong
/*exports.checkEthBalance = function(req, res) {
	console.log("Inside check ether balanace");
	var accountAddr = req.body.accountAddress;

	web3.eth.getBalance(accountAddr, function(err,resp){
		console.log("Errorrr "+err);
		console.log("Resppp "+resp);
		if(err){
			console.log("Error is: "+err)
		}
		else{
			console.log("Response is: "+resp)
			var ethBalance = resp.toNumber();
			return res.json({"success":"true","data":[{"balance": ethBalance}]});
		}
	})
}*/





exports.checkCoinBalance = function(req, res) {
	console.log("check balanace");
	var accountAddr = req.body.accountAddress;
	if(isAddress(accountAddr)==false){
		console.log("This address is not valid");
		return res.json({"success":"false","data":[{"message":"Inavlid address"}]});

	}
	var coinBalance=contract.balanceOf(accountAddr).toNumber(); 	    		
	console.log(coinBalance);
	return res.json({"success":"true","data":[{balance: coinBalance}]});
	//return "success";
}


exports.transferEther = function(req, res) {
	console.log("Inside transfer Ether function");
	var to=req.body.recipientAddress;
	var from= req.body.senderAddress;
	var amount=req.body.transferAmount;
	var passphrase=req.body.passphrase;

    // verify Sender's address
    if(isAddress(from)==false){
    	console.log("Inavlid Sender's address");
    	return res.json({"success":"false",data:[{"message":"Inavlid Sender's address"}]});

    }

	// verify reciever's address
	if(isAddress(to)==false){
		console.log("Inavlid Recipient's address");
		return res.json({success:"false","data":[{"message":"Inavlid Recipient's address"}]});

	}

	// unlock account
	web3.personal.unlockAccount(from,passphrase, function(_error,_resp){
		if(_error){
			console.log("Error in unlocking account");
			return res.json({"success":"false","data":[{"message":"Incorrect Password"}]});
		}
		else{
				//web3.eth.sendTransaction({to:to, from:from, value:web3.toWei(amount,"ether")},function( _erro,_respo){
					web3.eth.sendTransaction({to:to, from: from, value:web3.toWei(amount,"ether")}, function(err1, resp1){
						if(err1){
							console.log("Error is "+err1);
						// check if error is due to low balance
						if(err1=="Error: Insufficient funds for gas * price + value"){
							return res.json({success:"false","data":[{"message":"Insufficient funds"}]})
						}						
						else{													
							err1=err1.toString().replace("Error:","");  // err1 is object -- convert it to string						
							console.log("The error message after replacement is "+err1)
							return res.json({success:"false","data":[{"message":err1}]})
						}

					}
					else{						
						console.log("Transaction is="+resp1);
						return res.json({"success":"true","data":[{transactionId:resp1}]});
					}
			});// send Transaction callback ends here;
				}
	}); // unlock accnt callback ends here

}


exports.transferCoin = function(req, res) {
	console.log("transfer");
	var to=req.body.recipientAddress;
	var from= req.body.senderAddress;
	var amount=req.body.amount;
	var passphrase=req.body.passphrase;


	if(isAddress(from)==false){
		console.log("Inavlid Sender's address");
		return res.json({"success":"false","data":[{"message":"Inavlid Sender's address"}]});

	}
	if(isAddress(to)==false){
		console.log("Inavlid Recipient's address");
		return res.json({"success":"false","data":[{"message":"Inavlid Recipient's address"}]});

	}

		//web3.personal.unlockAccount(from,passphrase);
		web3.personal.unlockAccount(from,passphrase, function(_error,_resp){
			if(_error){
				console.log("Error");
				return res.json({"success":"false","data":[{"message":"Incorrect Password"}]});
			}
			else{
				var callData=contract.transfer.getData(to,amount);
				var estimatedGas=checkThrow(from,callData);
				console.log("Estimated Gas="+estimatedGas);
				if(!estimatedGas)
				{
					console.log("Intrinsic gas low");
					return res.json({"success":"false","data":[{"message":"Intrinsic Gas too low"}]});
				}
				else{

					var tx=contract.transfer(to, amount, {from: from});
					console.log("Transaction hash is: "+tx+" . Now we'll save it to DB");
					saveTransaction(tx);
					//watchTransaction();
					return res.json({"success":"true", "data":[{"transactionHash":tx}]});
			}// estimates gas ends
		}

	})
	} // function transfer coin ends here


	
	// saving transaction details to database.
	function saveTransaction(tx){
		TransactionService.saveTransaction(tx, function(resp){
			if(!resp.error){
				console.log("Resp from db : "+JSON.stringify(resp));
			//return res.json({"success":false,"data":[{"message":"Inavlid Sender's address"}]});	
		}
		else{
			console.log("transaction could not be saved");
			//return res.json({error:"true","message":""})
			//return res.json({"success":false,"data":[{"message":"Inavlid Sender's address"}]});
		}
	});
	} // save Transaction ends here
	


// function check transaction status
/*exports.checkTransactionStatus = function(req, res) {
	var transactionId = req.body.transactionid;
	console.log(transactionId);
	//check if transaction Hash is correct
	try {
 		 web3.eth.getTransactionReceipt(transactionId);
 		 //check transaction id in database
		Transaction.find({transactionid : transactionId}, function(err, transaction) {
		console.log(transaction);
			// if transaction is found in database : returm it's status
			if(transaction.length >0){
				console.log("Transaction found in database");
				return res.json({"success":"true","data":[{"transactionStatus":transaction[0].status}]});
			}
			// if transaction not found in database: look for transaction status from blockchain
			else{
				var blockNumber = web3.eth.getTransaction(transactionId).blockNumber;
				if(blockNumber == null){
					return res.json({"success":"true", "data":[{"transactionStatus":"Pending"}]});
				}
				else{
					return res.json({"success":"true", "data":[{"transactionStatus":"Success"}]});
				}
			}
			
		});
		}
	catch(e) {
  		 console.log("invalid tx receipt: " + e);
  		 return res.json({"success":"false","data":[{"message":"Incorrect transaction hash"}]});

		}
}
*/


// checck transaction status without DB.
	exports.checkTransactionStatus = function(req,res){
		var transactionId = req.body.transactionid;
		console.log(transactionId);
		try{
			var txReciept = web3.eth.getTransactionReceipt(transactionId);
			if(txReciept == null || txReciept == undefined)
				return res.json({"success":"true", "data":[{"transactionStatus":"Pending"}]});
			else
				return res.json({"success":"true", "data":[{"transactionStatus":"Pending"}]});
			}
		catch(e) {
  		 console.log("invalid tx receipt: " + e);
  		 return res.json({"success":"false","data":[{"message":"Incorrect transaction hash"}]});

		}	

	}


	// this is working code
	/*exports.checkTransactionStatus= function(req, res){
		var transactionId = req.body.transactionid;
		console.log(transactionId);
		var blockNumber = web3.eth.getTransaction(transactionId).blockNumber;
		if(blockNumber == null )
			return res.json({"success":"true", "data":[{"transactionStatus":"Pending"}]});
		else
			return res.json({"success":"true", "data":[{"transactionStatus":"Success"}]});
		console.log(obj);
		/*var status = obj[transactionId];
		console.log(status);
		return res.json({"success":"true", data:[{"transactionStatus":status}]})*/
	//}
			}




/*
function watchTransaction(tx){
	console.log("Transaction ID : "+tx);
	contract.Transfer(function(err,result){
		if(!err){
			if(result.transactionHash==tx){
				console.log("success");
				Transaction.findOne({transactionid : tx} , function(err, transaction) {
					console.log("Trans updating : "+JSON.stringify(transaction));
					if(err){
						return "Error";
					}
					if(transaction != null && transaction != undefined){
						transaction.update({status : "success"}, function(_err, _resp) {
							return "Status updated";
						});
					}
				});				
			}
		}
	});
}
*/


// watching transaction v2
// watches transaction based on events. // depends on contract code
// the function needs to be executed continuously
// not yet tested
/*function watchTransaction(){
	console.log("Watching tx");
	contract.Transfer(function(error, resp){
		if(error){
			console.log("Error in watching transaction");
		}
		else if (resp.blockNumber != null){  // perfom any operation only if transaction is  mined
			var tx= resp.transactionHash;
				console.log("transaction that is been watched is: "+tx);
				Transaction.findOne({transactionid:tx},function(_err, _resp){
					if(_err){
						console.log("No matching tx found");
					}
					if(_resp != null && _resp != undefined){
						Transaction.update({transactionid:tx}, {status:"Success"},function(_err1, _resp1){
							console.log("Transaction: "+tx+" status updated succesfully." )
						})
					}

		}) // tx.find one ends here

	} // else ends here

})
}*/



// another approach to checkTransaction status - V3
// this function will update status fo all pending transactions. You can call this function after every n seconds and it will update the db.
function watchTransaction(){	
	Transaction.find({"status":"PENDING"}, function(err, res){
		if(!err){
			//console.log(res);

			//for(var tx in res.transactionid){
				for ( var i=0; i < res.length; i++){
					var tx= res[i].transactionid;
					console.log("tx is :"+tx);
				// performn this for each trannsaction in pending pool
				var blockNumber = web3.eth.getTransaction(tx).blockNumber;
				console.log("Block no= "+blockNumber);
				//if(blockNumber- web3.eth.blockNumber > 0){
					if(blockNumber!= null){
				// make status to confirmed
				Transaction.update({transactionid:tx}, {status:"Success"},function(_err1, _resp1){
					console.log("Transaction: "+tx+" status updated succesfully." )
				})
			}
		}  // for each ends here

	}
})
} // watch transaction ends here*/


// calling watch Transaction function every 13 seconds
var interval = setInterval(watchTransaction, 13000);


/*var intervalID = setInterval(function(){
	Transaction.find({"status":"PENDING"}, function(err, res){
		if(!err){
			console.log(res);

			//for(var tx in res.transactionid){
				for ( var i=0; i < res.length; i++){
					var tx= res[i].transactionid;
					console.log("tx is :"+tx);
				// performn this for each trannsaction in pending pool
				var blockNumber = web3.eth.getTransaction(tx).blockNumber;
				console.log("Block no= "+blockNumber);
				//if(blockNumber- web3.eth.blockNumber > 0){
					if(blockNumber!= null){
				// make status to confirmed
				Transaction.update({transactionid:tx}, {status:"Success"},function(_err1, _resp1){
					console.log("Transaction: "+tx+" status updated succesfully." )
				})
			}
		}  // for each ends here

	}
})
}, 60000);*/





exports.createNewAccount = function (req, res){
	var passphrase = req.body.passphrase;
	var accountAddress = web3.personal.newAccount(passphrase, function(_error,_res){
		if(_error){
			return res.json({"success":"true","data":[{"message":"Error in creating account."}]});
		}
		else{
			return res.json({"success":"false","data":[{accountAddress:_res}]});
			//return res.json({"success":"true","data":[{accountAddress:accountAddress}]});
		}
	});
	//return res.json({error : false , "message" : accountAddress});
}

var isAddress = function (address) {
	// function isAddress(address) {
		if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
        // check if it has the basic requirements of an address
        return false;
    } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
        // If it's all small caps or all all caps, return "true
        return true;
    } else {
        // Otherwise check each case
        return isChecksumAddress(address);
    }
}


var isChecksumAddress = function (address) {
    // Check each case
    address = address.replace('0x','');
    var addressHash = web3.sha3(address.toLowerCase());
    for (var i = 0; i < 40; i++ ) {
        // the nth letter should be uppercase if the nth digit of casemap is 1
        if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
        	return false;
        }
    }
    return true;
}


	// function checks if contract function executes properly or throws
	function checkThrow(frm,callData){
		var estimatedGas=web3.eth.estimateGas({from:frm,to:contractAddress,data:callData});
		console.log(estimatedGas);
		if(estimatedGas==50000000){
    		//alert("intrinsic gas too low");
    		return false;
    	}

    	else return estimatedGas;
    }


    /*exports.checkSendTransaction = function checkTransaction(req, resp){
    	web3.personal.unlockAccount(web3.eth.accounts[1],"password")
    	web3.eth.sendTransaction({to:web3.eth.accounts[0], from: web3.eth.accounts[1], value:web3.toWei(10998075160000000000000,"ether")}, function(err1, resp1){
    		console.log(err1);
    		if(err1){
    			console.log("error");
    		}
    		else{
    			console.log(resp1);
    		}
    	});
    }*/


	// just to test speed of node api. This functiona is taking  60 , 19, 11, 12ms   
	/*exports.sayMyName= function sayMyName(req, resp){
		var name = req.body.name;
		return resp.json({"Name":name})
	}*/


   /*// check timeout
   exports.multiply =  function multiply(req, resp){
   		var a = req.body.a;
   		while(a<1000000)
   		{
   			var b=0;
   			while(b<100000)
   			{
   				b++;
   			}
   			a++;
   		}
   		return resp.json({"Value":a});
   	}*/

