// More infos on custom errors: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
// and bluebird docs https://github.com/petkaantonov/bluebird/blob/master/API.md
// throw these errrors from resources, handle them in the controlllers, for that you can use controller_errors.js

// AUTH ERROR
var AuthError = function(message){
    this.name = 'AuthError';
    this.message = message || 'Not autorized to perform this action';
    Error.captureStackTrace(this, AuthError);
};
AuthError.prototype = Object.create(Error.prototype);
AuthError.prototype.constructor = AuthError;

//VALIDATION ERRROR
var ValidationError = function(message, path){
    this.name = 'ValidationError';
    this.message = message || 'Invalid input';
    this.path = path;
    Error.captureStackTrace(this, ValidationError);
};
ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

var MongooseError = require('mongoose/lib/error');

function ArrayCastError(err){
    if (err.message.indexOf("Cannot use 'in' operator") >= 0) {
        err.name = 'ArrayCastError';
        return true;
    }
}

module.exports.AuthError = AuthError;
module.exports.ValidationError = ValidationError;
module.exports.MongooseError = MongooseError;
module.exports.ArrayCastError = ArrayCastError;
