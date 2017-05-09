'use strict'

module.exports = function(app) {
	app.use('/eth', require('./api/index'));
}