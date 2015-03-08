var config = loadConfig();

var socket = require('socket.io');
var passportSocketIo = require('passport.socketio');
var mongoose = require('mongoose');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var cookieParser = require('cookie-parser');

var run = function(server, app) {
    var io = socket(server);
    global.io = io;

    // Sets up shared auth between express and socket
    io.use( passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: 'connect.sid',
      secret: config.sessionSecret,
      store: new MongoStore({ mongooseConnection: mongoose.connection }),
      success: authSuccess,
      fail: authFail,
    }) );

    // Connection will be called only for authed users
    io.on('connection', function(socket) {
        var user = socket.request.user;

        socket.emit(user.slackId, { msg: 'Username is: ' + user.displayName } );
        socket.emit(user.slackTeamId, { msg: 'Team is: ' + user.slackTeamId } );

        socket.on('disconnect', function(){
            logger.info('socket disconnected');
        });
    });

    function authSuccess(data, accept){
        logger.info('socket authed');
        accept();
    }

    function authFail(data, message, error, accept){
        logger.info('socket auth fail');
        accept(new Error(message));
    }
};

module.exports = {
    run: run
};