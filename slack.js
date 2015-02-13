var config = require('./config');
var Bluebird = require('bluebird');
var _ = require('lodash');
var Slacklib = require('slacklib');

var Record = require('./models/record');

var Pusher = require('pusher');
var push = new Pusher({
    appId: config.pusher.appid,
    key: config.pusher.key,
    secret: config.pusher.secret
});

var slack = new Slacklib(config.slack.token);

/**
 * Save new record
 * @param  {Object} doc Normalised doc ready to go into db
 * @return {Promise}
 */
var save = function(doc) {
    var newDoc = new Record(doc);

    return new Bluebird(function(resolve, reject){
        newDoc.save( function(err, doc) {
            if(err) return reject();
            return resolve(doc);
        });
    });
};

var find = function(doc) {
    return Record.findOne({ parsedResult: doc.parsedResult }).execAsync();
};

var createOrUpdate = function(obj) {
    return find(obj).then(function(doc) {
        console.log('db doc:', doc);
        if (doc) { //update
            console.log('updating');
            delete obj._id;
            var newDoc = _.extend(doc, obj);

            return new Bluebird( function(resolve, reject) {
                newDoc.save( function(err, dbDoc) {
                    if(err) return reject(err);
                    return resolve(dbDoc);
                }); // mongoose method
            });
        } else { //create
            console.log('saving');
            return save(obj);
        }
    });
};
/**
 * Post latest record to web via Pusher
 * @param  {Object} doc Record
 */
var postPusher = function (doc) {
    console.log('* Pushing to pusher:', doc);
    push.trigger('feed', 'message', doc);
};

/**
 * Normalise record before storing in DB
 * @param  {Object} obj Message received from slackbot
 * @return {Promise}     Promise
 */
var storeRecord = function(obj) {
    var msg = obj.message;
    var doc = {
        team: msg.team,
        channel: msg.channel,
        user: msg.user,
        text: msg.text,
        parsedType: obj.parsedType,
        parsedResult: obj.parsedResult,
        dump: JSON.stringify(obj)
    };

    return createOrUpdate(doc).then(function(newDoc) {
        postPusher(newDoc);
    }).catch(function(err){
        console.log('error:', err);
    });
};

/**
 * Run the script, init slack listener
 * @return {Promise} Promises will take you all the way
 */
var run = function() {
    slack.on('processed', storeRecord);

    return new Bluebird(function(resolve, reject) {
        slack.bot.on('open', function(){
            console.log('* Opened connection to Slackbot');
            return resolve();
        });
    });
};

/**
 * Exports
 */
module.exports = {
    run: run,
    storeRecord: storeRecord,
    postPusher: postPusher,
    save: save
}