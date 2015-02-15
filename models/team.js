'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var findOrCreate = require('mongoose-findorcreate')

/* Main Schema */
var schema = new Schema({
    /* Account info */
    teamId: {
        type: String,
        required: true
    }
},
{
    safe: true,
    strict: true
});

schema.plugin(findOrCreate);

var Team = mongoose.model('Team', schema);
module.exports = Team;