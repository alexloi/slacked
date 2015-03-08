'use strict'

var config = loadConfig();
var Class = require('jsclass/src/core').Class;
var ResourceController = dependency('lib', 'resource_controller');
var _ = require('lodash');
var JSONApiMongo = dependency('lib', 'jsonapi_mongo');
var passport = require('passport');
var Bluebird = require('bluebird');

var ErrorTypes = dependency('lib', 'error');
var errorHandlers = dependency('lib', 'controller_error');
var AuthError = ErrorTypes.AuthError;
var ValidationError = ErrorTypes.ValidationError;
var ArrayCastError = ErrorTypes.ArrayCastError;
var RoleError = ErrorTypes.RoleError;
var MongooseError = ErrorTypes.MongooseError;
var handleErrors = errorHandlers.handleErrors;

/**
 * [UserController User controller]
 * @type {Object}
 */
var UserController = new Class(ResourceController, {

    index: function(req, res){
        var self = this;
        return Bluebird.reject(new AuthError('Unauthorized, please use individual queries'))
            .catch(AuthError, errorHandlers.handleAuthError.bind(self, res, 'find'));
    },

    signup: function(req, res) {
        var self = this;

        var opts = {
            user: req.user || { role: ''},
            data: req.body || {}
        };

        return self.resource.create(opts)
            .get('docs')
            .then(function(user){
                // Login on Bluebird
                return new Bluebird(function(resolve, reject){
                    req.login(user, function(err){
                        if(err) return reject(err);
                        else return resolve(user);
                    });
                });
            })
            .then(function(user){
                res.send(200, user.toJson());
            })
            .catch(RoleError, errorHandlers.handleRoleError.bind(self, res, 'signup'))
            // auth errors
            .catch(RoleError, AuthError, errorHandlers.handleAuthError.bind(self, res, 'signup'))
            // mongoose validation errors, cast to ObjectId errors and other fancyness
            .catch(ValidationError, ArrayCastError, MongooseError, errorHandlers.handleMongooseError.bind(self, res, 'signup'))
            // programmer errors
            .catch(TypeError, ReferenceError, errorHandlers.handleProgrammerError.bind(self, res, 'signup'))
            // all other errros
            .catch(errorHandlers.handleServerError.bind(self, res, 'signup'));
    },

    login: function(req, res, next){
        var self = this;
        var data = req.body;
        // Check we got the right fields
        // if(!data || !data.email || !data.password) {
        //     throw new AuthError('Please provide email & password to login a user');
        // }
        var opts = {
            user: {
                role: 'internal',
                email: data.email
            },
            data: {
                email: data.email
            }
        };

        return self.resource.findOne(opts)
        .get('docs')
        // .tap(function(dbUser){
        //     if(!dbUser || dbUser.length === 0) throw new AuthError('No such user');
        //     if(dbUser.length > 1) throw new AuthError('Multiple registered users with this email');
        // })
        // .then(function authenticate(dbUser){
        //     return auth.authenticate.user(dbUser[0].password, data.password);
        // })
        // .then(function checkAuth(authenticated){
        //     if (!authenticated) throw new AuthError('Wrong password');
        // })
        // .then(function passportAuth(){
        //     return new Bluebird(function(resolve, reject){
        //         passport.authenticate('local', function(err, user) {
        //             if(err) reject(err);
        //             resolve(user);
        //         })(req,res,next);
        //     });
        // })
        // .then(function login(user){
        //     // Login on Bluebird
        //     return new Bluebird(function(resolve, reject){
        //         req.login(user, function(err){ return err ? reject(err) : resolve(user); });
        //     })
        //     .then(function(user){
        //         return res.send(200, user.toJson());
        //     });
        // })
        // auth errors
        .catch(AuthError, errorHandlers.handleAuthError.bind(self, res, 'login'))
        // mongoose validation errors, cast to ObjectId errors and other fancyness
        .catch(ValidationError, ArrayCastError, MongooseError, errorHandlers.handleMongooseError.bind(self, res, 'login'))
        // programmer errors
        .catch(TypeError, ReferenceError, errorHandlers.handleProgrammerError.bind(self, res, 'login'))
        // all other errros
        .catch(errorHandlers.handleServerError.bind(self, res, 'login'));
    },

    /**
     * [forgot user forgot her pass, just post her mail address, and an optional client to set the page where you want to redirect]
     * @param  {[type]}   req  [req.body.email, req.body.client]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    forgot: function(req, res){
        var self = this;

        req.logout();

        self.resource.findOne({
            data: {
                email: req.body.email || ''
            },
            user: { role: 'internal', email: req.body.email || '' }
        })
        .get('docs').get(0)
        .tap(function(user){
            if (!user) throw new ValidationError('We have no records for this user account! Please make sure you`re entering the correct email');
        })
        .tap(function generateForgotPasswordTokenForUser(user){
            return Bluebird.promisify(user.generateForgotPasswordToken).call(user);
        })
        .then(function saveGeneratedTokenToUser(user){
            return Bluebird.promisify(user.save).call(user);
        })
        .get(0)
        .then(function sendEmailWithResetLinkThatHasTheToken(user){
            // TODO use a proper email template
            // var forgotLink = config.protocol + config.serverAddr;

            // if(user.role === 'retail') forgotLink += '/retail/#/reset/' + user.forgot_password_token;
            // if(_.contains(['hub', 'admin'], user.role)) forgotLink += '/reset/' + user.forgot_password_token;

            // // util.format('http://%s/' + user.role + '/#/reset/%s', config.serverAddr, user.forgot_password_token);
            // var forgotHtml = '<h4>Hi ' + user.email + ',</h4>' + "<p> We're sending you this email because you have requested  to reset your account password. </p> " + "<p> Please click on the following link to reset your password: <a href='" + forgotLink + "'>" + forgotLink + "</a></p>" + "<p> If you have any problems or didn't request a password reset please contact our support team. We've attached the details below." + "<p> Best, </p>" + "<b> The StreetHub Team </b>" + "<br>" + "<br><b> Support phone:</b> 0207 193 6444 " + "<br><b> Support email:</b> hello@streethub.com";

            // if ( user.email ){
            //     return Bluebird.promisify(sendgrid.send).call(sendgrid, {
            //             from: 'support@streethub.com',
            //             fromname: 'StreetHub Support',
            //             to: user.email,
            //             toname: user.email,
            //             subject: 'Reset password',
            //             html: forgotHtml
            //         });
            // } else if (user.facebook_profile) {
            //     throw new ValidationError("Sorry we couldn't reset your password, because you signed up with facebook. Please try to login with that.");
            // } else {
            //     throw new ValidationError("No such user");
            // }
        })
        .then(function(){
            return res.send(204);
        })
        // auth errors
        .catch(AuthError, errorHandlers.handleAuthError.bind(self, res, 'forgot'))
        // mongoose validation errors, cast to ObjectId errors and other fancyness
        .catch(ValidationError, ArrayCastError, MongooseError, errorHandlers.handleMongooseError.bind(self, res, 'forgot'))
        // programmer errors
        .catch(TypeError, ReferenceError, errorHandlers.handleProgrammerError.bind(self, res, 'forgot'))
        // all other errros
        .catch(errorHandlers.handleServerError.bind(self, res, 'forgot'));
    },

    reset: function(req, res){

        var self = this;

        var new_password = req.body.new_password;
        var new_password_confirmation = req.body.new_password_confirmation;

        return self.resource.findOne({
            data: {
                'forgot_password_token': req.body.forgot_password_token || ''
            },
            user: { role: 'admin' }
        })
        .get('docs').get(0)
        .tap(function validateFields(){
            if (!new_password) throw new ValidationError('Missing password!');
            if (!new_password_confirmation) throw new ValidationError('Missing password confirmation!');
            if (new_password_confirmation !== new_password) throw new ValidationError("The two passwords don't match!");

            // Is the password between 6 and 20 chars?
            if(new_password.length < 6 || new_password.length > 20){
                throw new ValidationError('The password should have a length of 6 to 20 characters');
            }
        })
        .tap(function(user){
            if (!user) throw new ValidationError('Invalid password reset token! This token has already been used, please reset your password.');
            return Bluebird.promisify(user.setPassword).call(user, new_password);
        })
        .then(function(user){
            user.forgot_password_token = undefined;
            return Bluebird.promisify(user.save).call(user);
        })
        .get(0)
        .then(function(user){
            return new Bluebird(function(resolve, reject){
                req.login(user, function(err){
                    if(err) return reject(err);
                    return resolve(user);
                });
            })
            .then(function(){
                res.send(204);
            });
        })
        // auth errors
        .catch(AuthError, errorHandlers.handleAuthError.bind(self, res, 'reset'))
        // mongoose validation errors, cast to ObjectId errors and other fancyness
        .catch(ValidationError, ArrayCastError, MongooseError, errorHandlers.handleMongooseError.bind(self, res, 'reset'))
        // programmer errors
        .catch(TypeError, ReferenceError, errorHandlers.handleProgrammerError.bind(self, res, 'reset'))
        // all other errros
        .catch(errorHandlers.handleServerError.bind(self, res, 'reset'));
    },

    logout: function(req, res){
        req.logout();
        return res.send(200);
    },

    isloggedin: function(req, res){
        var isLoggedIn = req.isLoggedIn();
        return res.send(200, {
            user: isLoggedIn ? req.user.toJson() : {},
            isLoggedIn: isLoggedIn
        });
    },

    slackAuth: passport.authorize('slack'),

    slackHandler: passport.authenticate('slack', {
        successRedirect: '/onboard',
        failureRedirect: '/error'
    }),

});

module.exports = UserController;

