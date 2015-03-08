'use strict';

var apiPath = function(route) {
    if(!route || route.length === 0) route = '';
    return '/api/v1/' + route;
};

module.exports = {
    apiPath: apiPath
};