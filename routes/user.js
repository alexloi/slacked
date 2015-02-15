'use strict'

var config = loadConfig();
var passport = require('passport');

module.exports = function(app) {
    app.get('/auth/slack', passport.authorize('slack'));
    app.get('/auth/slack/callback',
        passport.authenticate('slack', { failureRedirect: '/error' }),
        function(req, res) {
            // Successful authentication, redirect home.
            return res.redirect('/');
        }
    );
    app.get('/error', function( req, res) {
        return res.send(400);
    });
}


