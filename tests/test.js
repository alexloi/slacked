var globals = require('../globals');
var fs = require('fs');
var _ = require('lodash');
var mongoose = require('mongoose');
var Bluebird = require('bluebird');

var chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

Bluebird.promisifyAll(mongoose);
Bluebird.longStackTraces();

mongoose.models = {};
mongoose.modelSchemas = {};
// export all the .ENV variables when runnning the tests
var source;
try{
    source = fs.readFileSync(__dirname + '/../.env', 'utf-8');
} catch (e) {
    // if .env is not there, ex: circleci then do nothing
    source = '';
}

source.split('\n').forEach(function (line) {
    var parts = line.split('=');
    process.env[parts[0]] = parts[1];
});

if (!_.contains(['testing', 'circleci'], process.env.NODE_ENV)) throw new Error('To run the tests please ensure you env is testing or circleci');

// Setup

var config = loadConfig();
if (mongoose.connection.readyState === 0) {
    mongoose.connect(config.db);
}

if (process.env.TEST) {
    require('./' + process.env.TEST + '.test');
} else {
    var fs = require('fs');

    fs.readdirSync(__dirname).forEach(function (file) {
        if (/\.test\.js$/.test(file)) {
            require('./' + file);
        }
    });
}
