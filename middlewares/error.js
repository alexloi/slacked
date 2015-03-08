'use strict';
/**
 * Used for generic errors in routes.
 */
module.exports.genericError = function(err, req, res) {
    // console.log('Error: middleware', err);
    // console.trace(err);
    // #todo: make a proper 500
    return res.status(500);
};
/**
 * Last thing to get called, assumed 404.
 */
module.exports.notFound = function(req, res) {
    return res.send('Not Found', 404);
};