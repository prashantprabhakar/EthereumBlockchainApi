'use strict';

var express = require('express'),
	mongoose = require('mongoose'),
	http = require('http'); 

const PORT = 7000; //port on which this server runs

var app = express(); 
var dbUrl = "mongodb://localhost/ethereum";  //ethereum is name of db.
var server = require('http').createServer(app); 
var bodyParser = require('body-parser');  //required to parse the body of requests/responses
app.use(bodyParser.urlencoded());

mongoose.connect(dbUrl);

mongoose.connection.on('error', function(err){
	console.log("MongoDB connection Error");
	process.exit(0);
});

require('./routes')(app);

// //We need a function which handles requests and send response
// function handleRequest(request, response){
//     //response.end('It Works!! Path Hit: ' + request.url);
//     console.log('It Works!! Path Hit: ' + request.url);
// }


//var server = http.createServer(handleRequest);
//var server=http.createServer();





mongoose.connection.once('open', function() {
	//Lets start our server
	server.listen(PORT, function(){
	    //Callback triggered when server is successfully listening. Hurray!
	    console.log("Server listening on: http://localhost:%s", PORT);
	});	
})




exports = module.exports = app;
