'use strict';

// import mongoDB native drivers
var mongodb = require ('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
//ethereum is the name of database
var url = 'mongodb://localhost/ethereum';

// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db){
	if(err){
		console.log("Unable to connect to database. Error: ",err);
	}
	else{
		console.log("Connection established to ", url);

		//perform db operations

		//Close connection
		db.close();
	}
});