var globals = require('./globals');
var http = require('http');
var mongo = dependency('initializer', 'mongo');
// var slack = require('./slack');
var express = dependency('initializer', 'express');
var passport = dependency('initializer', 'passport');
var socket = dependency('initializer', 'socket');
var resourceLoader = dependency('initializer', 'resource_loader');

mongo.init()
// .then(slack.run)
.then(function(){
    var app = express.run();
    resourceLoader.init(app);
    passport.init();

    var server = http.Server(app);
    socket.run(server, app);

    server.listen(3000, function(){
        logger.info(' *** Server & socket running ***');
    });
})
.catch(function(err){
    console.log('SERVER ERROR:', err.stack);
    process.exit(1);
});