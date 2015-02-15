'use strict';

var config = loadConfig();
var passport = require('passport');
var SlackStrategy = require('passport-slack').Strategy;
var User = dependency('model', 'user');

var init = function() {
    passport.serializeUser(function(user, done) {
        return done(null, user._id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findOne({_id:id} , function(err, user) {
            return done(err, user);
        });
    });

    passport.use(new SlackStrategy({
            clientID: config.slack.clientid,
            clientSecret: config.slack.secret
            // callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            var newUser = {
                provider: profile.provider,
                displayName: profile.displayName,
                slackTeamId: profile._json.team_id,
                accessToken: accessToken,
            };

            User.findOrCreate({ slackId: profile.id }, newUser, function (err, user) {
                return done(err, user);
            });
        }
    ));
};

module.exports = {
    init: init
};
