var globals = require('./globals');
var http = require('http');
var mongo = dependency('initializer', 'mongo');
// var slack = require('./slack');
var express = dependency('initializer', 'express');
var passport = dependency('initializer', 'passport');
var socket = dependency('initializer', 'socket');

mongo.init()
// .then(slack.run)
.then(function(){
    var app = express.run();
    passport.init();

    var server = http.Server(app);
    socket.run(server, app);

    server.listen(3000, function(){
        console.log(' *** Server & socket running ***');
    });
})
.catch(function(err){
    console.log('SERVER ERROR:', err.stack);
    process.exit(1);
});