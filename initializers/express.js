'use strict';

var config = loadConfig();

var mongoose = require('mongoose');
var express = require('express');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var morgan = require('morgan');

var app = express();

var passportConfig = dependency('initializer', 'passport');
var resourceLoader = dependency('initializer', 'resource_loader');
var errorMiddleware = dependency('middleware', 'error');
/**
 * Initial run config for express
 * @return {express}      Returns the mounted express app
 */
var run = function(http) {
    // Static
    app.use(express.static( 'public', {maxAge: 86400000} ));
    app.set('view engine', 'jade');
    app.set('views', 'public');
    app.use(cookieParser());
    app.use(bodyParser.json());

    // Session
    app.use(session({
        secret: config.sessionSecret,
        resave: true,
        saveUninitialized: true,
        store: new MongoStore({ mongooseConnection: mongoose.connection })
    }));

    // HTTP Logging
    app.use(morgan(':method :url :response-time :status'));

    // Passport
    passportConfig.init();
    app.use(passport.initialize());
    app.use(passport.session());

    // Routes, Resources & Controllers
    resourceLoader.init(app);

    // Error handling
    app.set('showStackError', true);
    app.use(errorMiddleware.notFound);
    app.use(errorMiddleware.genericError);

    return app;
};

module.exports = {
    run: run
};

