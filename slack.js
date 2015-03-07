var config = require('./config');
var Bluebird = require('bluebird');
var _ = require('lodash');
var Slacklib = require('slacklib');

var Message = dependency('model', 'message');

var Pusher = require('pusher');
var push = new Pusher({
    appId: config.pusher.appid,
    key: config.pusher.key,
    secret: config.pusher.secret
});

var slack = new Slacklib(config.slack.token);

/**
 * Save new message
 * @param  {Object} doc Normalised doc ready to go into db
 * @return {Promise}
 */
var save = function(doc) {
    var newDoc = new Message(doc);

    return new Bluebird(function(resolve, reject){
        newDoc.save( function(err, doc) {
            if(err) return reject();
            return resolve(doc);
        });
    });
};

/**
 * Find the message
 * @param  {Object} doc Prepared doc
 * @return {Promise}     Promise of find
 */
var find = function(doc) {
    return Message.findOne({ parsedResult: doc.parsedResult }).execAsync();
};

/**
 * Create or update the message
 * @param  {Object} obj Object to create Or update
 * @return {Promise}     creation / update promise
 */
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
 * Post latest message to web via Pusher
 * @param  {Object} doc Message
 */
var postPusher = function (doc) {
    console.log('* Pushing to pusher:', doc);
    push.trigger('feed', 'message', doc);
};

/**
 * Normalise message before storing in DB
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