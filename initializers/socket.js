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
        console.log('- User connected', socket.request.user);
        var user = socket.request.user;

        socket.emit(user.slackId, { msg: 'Username is: ' + user.displayName } );
        socket.emit(user.slackTeamId, { msg: 'Team is: ' + user.slackTeamId } );

        socket.on('disconnect', function(){
            console.log('- User disconnected');
        });
    });

    function authSuccess(data, accept){
        console.log('** Auth success');
        accept();
    }

    function authFail(data, message, error, accept){
        console.log('** Auth fail');
        accept(new Error(message));
    }
};

module.exports = {
    run: run
};