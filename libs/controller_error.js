'use strict';

var clc = require('cli-color');
var AuthError = dependency('lib', 'error').AuthError;
var ValidationError = dependency('lib', 'error').ValidationError;
var MongooseError = dependency('lib', 'error').MongooseError;
var Bluebird = require('bluebird');
var _ = require('lodash');
var config = loadConfig();

// Unique Error ids
var guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

function handleServerError (res, action, detail, error) {
    if (arguments.length < 4) {
        error = detail;
        detail = null;
    };

    var id = guid();
    console.error(clc.red.bold(id, 'JSONApi controller', action, 'error:\n', error.stack));
    return res.send(500, {
        errors: [{
            //id:
            code: 'ServerError', // An application-specific error code, expressed as a string value.
            //href: // with further details
            //path:  // The relative path to the relevant attribute within the associated resource(s). Only appropriate for problems that apply to a single resource or type of resource.
            // links: '', // Associated resources which can be dereferenced from the request document.
            id: id, // A unique identifier for this particular occurrence of the problem.
            title: 'Internal server error', // A short, human-readable summary of the problem. It SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization.
            detail: error.message || 'Internal server error', // A human-readable explanation specific to this occurrence of the problem.
            status: 500,
        }]
    });
}

function handleProgrammerError (res, action, detail, error) {
    if (arguments.length < 4) {
        error = detail;
        detail = null;
    };

    var id = guid();
    console.error(clc.red.bold(id, 'JSONApi controller', action, 'error:\n', error.stack));
    return res.send(500, {
        errors: [{
            //id:
            code: 'InternalError', // An application-specific error code, expressed as a string value.
            //href: // with further details
            //path:  // The relative path to the relevant attribute within the associated resource(s). Only appropriate for problems that apply to a single resource or type of resource.
            // links: '', // Associated resources which can be dereferenced from the request document.
            id: id, // A unique identifier for this particular occurrence of the problem.
            title: 'Internal server error', // A short, human-readable summary of the problem. It SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization.
            detail: error.message || 'Internal server error', // A human-readable explanation specific to this occurrence of the problem.
            status: 500,
        }]
    });
}

function handleAuthError (res, action, error) {
    var id = guid();
    console.error(clc.red.bold(id, 'JSONApi controller', action, 'error:\n', error.stack));
    return res.send(401, {
        errors: [{
            id: id, // A unique identifier for this particular occurrence of the problem.
            code: 'AuthError',
            title: 'Not authorized', // A short, human-readable summary of the problem. It SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization.
            detail: error.message || 'Not authorized', // A human-readable explanation specific to this occurrence of the problem.
            status: 401,
        }]
    });
}

function handleMongooseError (res, action, error) {

    var self = this;
    var id = guid();
    var status = 401;
    var errors = [];
    console.error(clc.red.bold(id, 'JSONApi controller', action, 'error:\n', error.stack));
    if (error instanceof MongooseError.CastError){
        status = 422;
        errors = [{
            id: id, // A unique identifier for this particular occurrence of the problem.
            code: 'CastError',
            title: 'The request contains an invalid id', // A short, human-readable summary of the problem. It SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization.
            detail: error.message, // A human-readable explanation specific to this occurrence of the problem.
            status: status,
        }];
    } else if (error instanceof MongooseError.ValidationError){
        status = 422;
        _.forEach(error.errors, function(err){
            errors.push({
                id: id, // A unique identifier for this particular occurrence of the problem.
                code: 'ValidationError',
                title: 'The following fields are invalid', // A short, human-readable summary of the problem. It SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization.
                detail: err.message || '', // A human-readable explanation specific to this occurrence of the problem.
                path: config.serverAddr + apiV2(self.resource.resourceName) + '/' + err.path,
                status: status,
            });
        });
    } else if (error instanceof ValidationError){
        status = 422;
        errors = [{
            id: id, // A unique identifier for this particular occurrence of the problem.
            code: 'ValidationError',
            title: 'The request is invalid', // A short, human-readable summary of the problem. It SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization.
            detail: error.message || '', // A human-readable explanation specific to this occurrence of the problem.
            path: error.path,
            status: status,
        }];
    } else if (error.name === 'ArrayCastError'){
        status = 422;
        errors = [{
            id: id, // A unique identifier for this particular occurrence of the problem.
            code: 'ValidationError',
            title: 'The request contains a malformed array', // A short, human-readable summary of the problem. It SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization.
            detail: '', // A human-readable explanation specific to this occurrence of the problem.
            status: status,
        }];
    } else {
        status = 500;
        errors = [{
            id: id, // A unique identifier for this particular occurrence of the problem.
            code: 'DatabaseError',
            title: 'The database was unable to to perform the request', // A short, human-readable summary of the problem. It SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization.
            detail: error.message, // A human-readable explanation specific to this occurrence of the problem.
            status: status,
        }];
    }
    return res.send(status, { errors: errors });
}

module.exports = {
    handleAuthError: handleAuthError,
    handleServerError: handleServerError,
    handleProgrammerError: handleProgrammerError,
    handleMongooseError: handleMongooseError
};