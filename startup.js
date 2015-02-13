var mongo = require('./mongo');
var slack = require('./slack');
var express = require('./express');

mongo.init()
.then(slack.run)
.then(function(){
    express.run();
    console.log(' *** Server running ***');
})
.catch(function(err){
    console.log('SERVER ERROR:', err);
    process.exit(1);
});