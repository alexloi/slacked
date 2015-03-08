var globals = require('./globals');
var config = loadConfig();
var http = require('http');
var mongo = dependency('initializer', 'mongo');
// var slack = require('./slack');
var express = dependency('initializer', 'express');
var socket = dependency('initializer', 'socket');

mongo.init()
// .then(slack.run)
.then(function(){
    var app = express.run();

    var server = http.Server(app);
    socket.run(server, app);

    server.listen(config.serverPort, function(){
        logger.info('ENV:', config.env);
        logger.info('SERVER:', config.serverAddr);
        logger.info('Running...');
    });
})
.catch(function(err){
    console.log('SERVER ERROR:', err.stack);
    process.exit(1);
});