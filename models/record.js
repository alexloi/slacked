'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    team: { type: String, required: true },
    channel: { type: String, required: true },
    user: { type: String, required: true },
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

schema.pre('save', function(next){
    this.counter++;
    // TODO: Resolve the channel, resolve the user, pull link meta
    return next();
});

var Record = mongoose.model('Record', schema);
module.exports = Record;
