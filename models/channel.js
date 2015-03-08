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
    channelSlackId: { type: String, required: true },
    imported: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    // How many times this link was shared
    counter: { type: Number, default: 0 },
    public: { type: Boolean, default: false }
},{
    safe: true,
    strict: true
});

schema.pre('save', function(next){
    this.counter++;
    // TODO: Resolve the channel, resolve the user, pull link meta
    return next();
});

/**
 * Plugins
 */
schema.plugin(plugins.addUpdatedField);
schema.plugin(plugins.toJson);

var Channel = mongoose.model('Channel', schema);
module.exports = Channel;
