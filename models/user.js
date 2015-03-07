'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var findOrCreate = require('mongoose-findorcreate')
var Team = dependency('model','team');

/* Main Schema */
var schema = new Schema({
    /* Account info */
    slackId: {
        type: String,
        required: true
    },
    provider: {
        type: String
    },
    displayName: {
        type: String
    },
    team: {
        type: Schema.ObjectId,
        ref: 'Team',
    },
    slackTeamId: {
        type: String
    },
    accessToken: {
        type: String
    },
    refreshToken: {
        type: String
    },
    email: {
        type: String,
        lowercase: true,
        index: {
            sparse: true
        },
        trim: true,
        default: null
    },
},
{
    safe: true,
    strict: true
});

schema.plugin(findOrCreate);

schema.pre('save', function(next) {
    var self = this;

    if(self.isNew){
        Team.findOrCreate({teamId: self.slackTeamId}, function(err, team){
            if(err) return next(err);

            self.team = team._id;
            return next();
        });
    } else {
        return next();
    }
});

var User = mongoose.model('User', schema);
module.exports = User;