'use strict';

var config = loadConfig();
var fs = require('fs');
var read = fs.readdirSync;
var _ = require('lodash');

// Global vars
var controllers = [];
var resources = [];
var routes = [];

/**
 * Register a resource
 * @param  {String} name   Name of the resource
 * @param  {Object} app    Express app
 * @param  {Object} config Config
 */

var register = function(name, app) {

    var resource;
    var Controller;
    var controller = {};
    var route;

    if (_.contains(resources, name)) resource = dependency('resource', name);
    if (_.contains(controllers, name)) Controller = dependency('controller', name);
    if (_.contains(routes, name)) route = dependency('route', name);

    if (Controller) controller = new Controller(resource);
    if (route) route(app, controller);
};

var removeDotFile = function(str) {
    return str[0] !== '.';
};

var init = function(app) {
    // find routes
    routes = read('./routes').filter(removeDotFile);

    // find controllers
    controllers = read('./controllers').filter(removeDotFile);

    // find resources
    resources = read('./resources').filter(removeDotFile);

    routes.forEach(function(name) {
        register(name, app);
    });

};

module.exports = {
    init: init
}