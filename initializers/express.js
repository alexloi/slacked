'use strict';

var config = loadConfig();

var mongoose = require('mongoose');
var express = require('express');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var passport = require('passport');

var app = express();

var userRoutes = dependency('route', 'user');
var staticRoutes = dependency('route', 'static');

var run = function() {
    app.listen('3000', '0.0.0.0');

    app.use(express.static( 'public', {maxAge: 86400000} ));
    app.set('view engine', 'jade');
    app.set('views', 'public');

    app.use(cookieParser());
    app.use(bodyParser.json());

    app.use(session({
        secret: 'sup3rs3cr37',
        resave: true,
        saveUninitialized: true,
        store: new MongoStore({ mongooseConnection: mongoose.connection })
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    userRoutes(app);
    staticRoutes(app);
};

module.exports = {
    run: run
};

