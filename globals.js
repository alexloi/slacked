'use strict';

var util = require('util');
var base = __dirname;


global.dependency = function(type, name){
    var path = util.format('%s/%ss/%s', base, type, name);
    return require(path)
};
global.loadConfig = function(){
    return require(base + '/config');
};
global.logger = dependency('initializer', 'logger');
