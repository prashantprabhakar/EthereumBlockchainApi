var loadtest = require('loadtest');

function optionsObject() {
  return { 
  url: 'http://localhost:7000/eth/checkEthBalance',
  maxRequests: 1,
  concurrency: 1,
  method: 'POST',
  contentType: 'application/json',
  body: {
     		body: {
     			accountAddress:"0x62720366ef403c9891e2bfbd5358ee3c8a57b113"
     		}
        }
   }
}

loadtest.loadTest(optionsObject(), function (error, result) {
	if (error) {
	 	console.log('Got an error: %s', error);
	} else {
	 	console.log(result);
	}
});
