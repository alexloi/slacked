var config = require('./config');
var express = require('express');
var Record = require('./models/record');

var app = express();

var run = function() {
    app.listen('3000', '0.0.0.0');
    app.use(express.static( 'public', {maxAge: 86400000} ));
    app.set('view engine', 'jade');
    app.set('views', 'public');

    app.get('/', function(res, res, next){
        Record.find().sort({ created_at: 'desc' }).execAsync()
        .then(function(records) {
            var data = {
                config: { pusherPublic: config.pusher.public },
                records: records
            };
            return res.render('index', data);
        });
    });
};

module.exports = {
    run: run
};

