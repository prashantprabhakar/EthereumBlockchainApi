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
	if(isAddress(accountAddr)==false){
		console.log("This address is not valid");
		return res.json({"success":"false","data":[{"message":"Inavlid address"}]});

	}
	var ethBalance=web3.eth.getBalance(accountAddr).toNumber(); 
	return res.json({"success":"true","data":[{"balance": ethBalance}]});
}

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
}


exports.transferEther = function(req, res) {
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
			web3.eth.sendTransaction({to:to, from: from, value:web3.toWei(amount,"ether")},
				    function(err1, resp1){
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
	web3.personal.unlockAccount(from,passphrase,
	    function(_error,_resp){
			if(_error){
				console.log("Error");
				return res.json({"success":"false","data":[{"message":"Incorrect Password"}]});
			}
			else{
				var callData=contract.transfer.getData(to,amount);
				var gasPrice = web3.eth.gasPrice.toNumber();
				var estimatedGas=checkThrow(from,callData,gasPrice);
				var ethBalance = web3.eth.getBalance(from).toNumber();
				var estimatedEther = estimatedGas ? (estimatedGas * gasPrice) : 0;
				console.log("Estimated Gas="+estimatedGas);
				if(estimatedEther && ethBalance < estimatedEther){
                   console.log("Ether balance is too low.");
                   return res.json({"success":false,"data":[{"message":"Could not estimate gas. There are not enough funds in the account, or the receiving contract address would through an error."}]});
                }
                else if (balance < amount) {
                  console.log("Coin balance is too low.", balance, amount);
                  return res.json({"success":false,"data":[{"message":"There are not enough token in the account, Please recharge your address and try again."}]});
                }
				if(!estimatedGas)
				{
					console.log("Intrinsic gas low");
					return res.json({"success":"false","data":[{"message":"Intrinsic Gas too low"}]});
				}
				else{
					var tx=contract.transfer(to, amount, {from: from, gas:(estimatedGas+100000), gasPrice:gasPrice});
					console.log("Transaction hash is: "+tx+" . Now we'll save it to DB");
					saveTransaction(tx);
					//watchTransaction();
					return res.json({"success":"true", "data":[{"transactionHash":tx}]});
				}// estimates gas ends
			}
		})
} // function transfer coin ends here

exports.mintToken = function(req, res){
	var to = req.body.recipientAddress;
	var amount = req.body.amount;
	var passphrase = req.body.passphrase;
	contract.owner(function(_err, _resp1){
		if(_err){
			res.json({"success":"false","data":[{"message":"Error in getting owner's address"}]});
			return res;
		}
		else{
			var fromAddress = _resp1;
			// check if addresses are valid
			if(isAddress(fromAddress)==false){
				console.log("Inavlid Coinbase address");
				res.json({"success":"false","data":[{"message":"Inavlid Coinbase address"}]});
				return res;
			}
			if(isAddress(toAddress)==false){
				console.log("Inavlid Recipient's address");
				res.json({"success":"false","data":[{"message":"Inavlid Recipient's address"}]});
				return res;
			}			
			web3.personal.unlockAccount(fromAddress,passphrase, function(_error,_resp){
				if(_error){
					console.log("Error");
					console.log(_error);
					res.json({"success":"false","data":[{"message":"Incorrect Password"}]});
					return res;
				}
				else{
					var callData=contract.mintToken.getData(toAddress,mintAmount);
					var gasPrice = web3.eth.gasPrice.toNumber();
					var estimatedGas=checkThrow(fromAddress,callData,gasPrice);
					var ethBalance = web3.eth.getBalance(fromAddress).toNumber();
					var estimatedEther = estimatedGas ? (estimatedGas * gasPrice) : 0;
					console.log("Estimated Gas="+estimatedGas);
					if(estimatedEther && ethBalance < estimatedEther){
	                   console.log("Ether balance is too low.");
	                   return res.json({"success":false,"data":[{"message":"Could not estimate gas. There are not enough funds in the account, or the receiving contract address would through an error."}]});
	                }
	                else if (balance < amount) {
	                  console.log("Coin balance is too low.", balance, amount);
	                  return res.json({"success":false,"data":[{"message":"There are not enough token in the account, Please recharge your address and try again."}]});
	                }
					else if(!estimatedGas)
					{
						console.log("Intrinsic gas low");
						res.json({"success":"false","data":[{"message":"Intrinsic Gas too low"}]});
						return res;
					}
					else{

						var tx=contract.mintToken(toAddress, mintAmount, {from: fromAddress, gas:(estimatedGas+100000), gasPrice:gasPrice});
						console.log("Transaction hash is: "+tx+" . Now we'll save it to DB");
						saveTransaction(tx);
						//watchTransaction();
						res.json({"success":"true", "data":[{"transactionHash":tx}]});
						return res;
					}// estimates gas ends
				}
			});
		}
	})
}

exports.setPrices = function(req, res) {
	console.log("setting prices");
	var sellPrice =req.body.sellPrice;
	var buyPrice = req.body.buyPrice;
	var passphrase=req.body.passphrase;
	var from;
	contract.owner(function(err, _res){
		if(err) {
			console.log("Error in getting contract owner");
		}
		else{
			var from = _res;			
			web3.personal.unlockAccount(from,passphrase, function(_error,_resp){
				if(_error){
					console.log("Error");
					console.log(_error);
					res.json({"success":"false","data":[{"message":"Incorrect Password"}]});
					return res;
				}
				else{
					// test this
					var callData=contract.setPrice.getData(sellPrice,buyPrice);
					var gasPrice = web3.eth.gasPrice.toNumber();
					var estimatedGas=checkThrow(from,callData,gasPrice);
					var ethBalance = web3.eth.getBalance(from).toNumber();
					var estimatedEther = estimatedGas ? (estimatedGas * gasPrice) : 0;
					console.log("Estimated Gas="+estimatedGas);
					if(estimatedEther && ethBalance < estimatedEther){
	                   console.log("Ether balance is too low.");
	                   return res.json({"success":false,"data":[{"message":"Could not estimate gas. There are not enough funds in the account, or the receiving contract address would through an error."}]});
	                }	                
					if(!estimatedGas)
					{
						console.log("Intrinsic gas low");
						res.json({"success":"false","data":[{"message":"Intrinsic Gas too low"}]});
						return res;
					}
					else{
						var tx=contract.setPrices(sellPrice, buyPrice, {from: from, gas:(estimatedGas+100000), gasPrice:gasPrice});
						console.log("Transaction hash is: "+tx+" . Now we'll save it to DB");
						saveTransaction(tx);
						//watchTransaction();
						res.json({"success":"true", "data":[{"transactionHash":tx}]});
						return res;
					}// estimates gas ends
				}
			});
		}
	});
} // function ends here

// Sell Coin
exports.sellCoin = function(req, res){
	var fromAddress = req.body.from;
	var amount=req.body.amount;
	var passphrase = req.body.passphrase;
	if(isAddress(fromAddress)==false){
		console.log("Inavlid Senders address");
		res.json({"success":"false","data":[{"message":"Inavlid Senders address"}]});
		return res;
	}	
	web3.personal.unlockAccount(fromAddress,passphrase, function(_error,_resp){
		if(_error){
			console.log("Error");
			console.log(_error);
			res.json({"success":"false","data":[{"message":"Incorrect Password"}]});
			return res;
		}
		else{
			var callData=contract.sell.getData(amount);
			var gasPrice = web3.eth.gasPrice.toNumber();
			var estimatedGas=checkThrow(fromAddress,callData,gasPrice);
			var ethBalance = web3.eth.getBalance(fromAddress).toNumber();
			var estimatedEther = estimatedGas ? (estimatedGas * gasPrice) : 0;
			console.log("Estimated Gas="+estimatedGas);
			if(estimatedEther && ethBalance < estimatedEther){
               console.log("Ether balance is too low.");
               return res.json({"success":false,"data":[{"message":"Could not estimate gas. There are not enough funds in the account, or the receiving contract address would through an error."}]});
            }
            else if (balance < amount) {
              console.log("Coin balance is too low.", balance, amount);
              return res.json({"success":false,"data":[{"message":"There are not enough token in the account, Please recharge your address and try again."}]});
            }
			if(!estimatedGas)
			{
				console.log("Intrinsic gas low");
				res.json({"success":"false","data":[{"message":"Intrinsic Gas too low"}]});
				return res;
			}
			else{
				var tx=contract.sell(amount, {from: fromAddress, gas:(estimatedGas+100000), gasPrice:gasPrice});
				console.log("Transaction hash is: "+tx+" . Now we'll save it to DB");
				saveTransaction(tx);
				//watchTransaction();
				res.json({"success":"true", "data":[{"transactionHash":tx}]});
				return res;
			}// estimates gas ends
		}
	});
}

// Buy Coin
exports.buyCoin = function(req, res){
	var fromAddress = req.body.from;
	var amount=web3.toWei(req.body.ether,"ether");
	var passphrase = req.body.passphrase;
	if(isAddress(fromAddress)==false){
		console.log("Inavlid Coinbase address");
		res.json({"success":"false","data":[{"message":"Inavlid Coinbase address"}]});
		return res;
	}
	//check if from Address has ethers
	var eth = web3.eth.getBalance(fromAddress).toNumber();
	if(eth<amount){
		res.json({"success":"false","data":[{"message":"Low ether balance"}]});
		return res;
	}
	web3.personal.unlockAccount(fromAddress,passphrase, function(_error,_resp){
		if(_error){
			console.log("Error");
			console.log(_error);
			res.json({"success":"false","data":[{"message":"Incorrect Password"}]});
			return res;
		}
		else{
			var callData=contract.buy.getData();
			var gasPrice = web3.eth.gasPrice.toNumber();
			var estimatedGas=checkThrow(fromAddress,callData,gasPrice);
			var ethBalance = web3.eth.getBalance(fromAddress).toNumber();
			var estimatedEther = estimatedGas ? (estimatedGas * gasPrice) : 0;
			console.log("Estimated Gas="+estimatedGas);
			if(estimatedEther && ethBalance < estimatedEther){
               console.log("Ether balance is too low.");
               return res.json({"success":false,"data":[{"message":"Could not estimate gas. There are not enough funds in the account, or the receiving contract address would through an error."}]});
            }            
			if(!estimatedGas)
			{
				console.log("Intrinsic gas low");
				res.json({"success":"false","data":[{"message":"Intrinsic Gas too low"}]});
				return res;
			}
			else{
				var tx=contract.buy({from:fromAddress, value:amount, gas:(estimatedGas+100000), gasPrice:gasPrice});
				console.log("Transaction hash is: "+tx+" . Now we'll save it to DB");
				saveTransaction(tx);
				//watchTransaction();
				res.json({"success":"true", "data":[{"transactionHash":tx}]});
				return res;
			}// estimates gas ends
		}
	});
}

	
// saving transaction details to database.
function saveTransaction(tx){
	TransactionService.saveTransaction(tx, function(resp){
		if(!resp.error){
			console.log("Resp from db : "+JSON.stringify(resp));
		}
		else{
			console.log("transaction could not be saved");
		}
	});
} // save Transaction ends here
	

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

// this function will update status fo all pending transactions. 
//You can call this function after every n seconds and it will update the db.
function watchTransaction(){
	Transaction.find({"status":"PENDING"}, function(err, res){
		if(!err){
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


exports.createNewAccount = function (req, res){
	var passphrase = req.body.passphrase;
	var accountAddress = web3.personal.newAccount(passphrase, function(_error,_res){
		if(_error){
			return res.json({"success":"true","data":[{"message":"Error in creating account."}]});
		}
		else{
			return res.json({"success":"false","data":[{accountAddress:_res}]});
		}
	});
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
function checkThrow(frm,callData,gasPrice){
	var estimatedGas=web3.eth.estimateGas({from:frm,to:contractAddress,data:callData, gasPrice : gasPrice});
	console.log(estimatedGas);
	if(estimatedGas==90000){
		//alert("intrinsic gas too low");
		return false;
	}

	else return estimatedGas;
}