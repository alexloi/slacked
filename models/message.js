'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var plugins = dependency('lib','model_plugins');

var schema = new Schema({
    team: {
        type: Schema.ObjectId,
        ref: 'Team',
        required: true
    },
    channel: {
        type: Schema.ObjectId,
        ref: 'Channel',
        required: true
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    text: { type: String, required: true },
    parsedType: { type: String, required: true},
    parsedResult: { type: String },
    dump: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    // How many times this link was shared
    counter: { type: Number, default: 0 },
    public: { type: Boolean, default: false }
},{
    safe: true,
    strict: true
});

/**
 * Plugins
 */
schema.plugin(plugins.addUpdatedField);
schema.plugin(plugins.toJson);

/**
 * Hooks
 */
schema.pre('save', function(next){
    this.counter++;
    // TODO: Resolve the channel, resolve the user, pull link meta
    return next();
});

var Message = mongoose.model('Message', schema);
module.exports = Message;
