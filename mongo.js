var Bluebird = require('bluebird');
var mongoose = require('mongoose');
var uri = require('./config').db;

var init = function() {
    return new Bluebird(function(resolve, reject) {
        Bluebird.promisifyAll(mongoose);

        if (mongoose.connection.readyState === 1) return resolve();

        mongoose.connect(uri, function(err) {
            if(err) reject(err);
            resolve();
        });

        mongoose.connection.once('open', function () {
            console.log('* Mongo connected to:', uri);
            return resolve();
        });

        mongoose.connection.on('error', function(err) {
            console.log('* Mongo error:', err);
            reject(err);
            mongoose.disconnect();
        });
    });
};

module.exports.init = init;
