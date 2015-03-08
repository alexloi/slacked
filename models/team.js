'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var findOrCreate = require('mongoose-findorcreate')
var plugins = dependency('lib','model_plugins');

/* Main Schema */
var schema = new Schema({
    /* Account info */
    teamSlackId: { type: String, required: true },
    imported: { type: Boolean, default: false }
},
{
    safe: true,
    strict: true
});

/**
 * Plugins
 */
schema.plugin(findOrCreate);
schema.plugin(plugins.addUpdatedField);
schema.plugin(plugins.toJson);

var Team = mongoose.model('Team', schema);
module.exports = Team;