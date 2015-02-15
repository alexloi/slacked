var globals = require('./globals');
var mongo = dependency('initializer', 'mongo');
// var slack = require('./slack');
var express = dependency('initializer', 'express');
var passport = dependency('initializer', 'passport');

mongo.init()
// .then(slack.run)
.then(function(){
    express.run();
    passport.init();

    console.log(' *** Server running ***');
})
.catch(function(err){
    console.log('SERVER ERROR:', err.stack);
    process.exit(1);
});