'use strict';

var config = loadConfig();
var Singleton = require('jsclass/src/core').Singleton;
var Resource = dependency('lib', 'resource');
var Bait = require('bait');
var Bluebird = require('bluebird');
var Schema = dependency('model', 'channel');

/**
 * ChannelResource
 * @class Channel Resource
 * @augments {Resource}
 */
var ChannelResource = new Singleton(Resource, {
    name: 'Channel',
    schema: Schema,

    // Permissions of the method in the model
    permissions: {
        findOne: ['all'],
        find: ['all'],
        create: ['all'],
        remove: ['all'],
        update: ['all'],
    },

    /**
     * Binds all different types of hooks (pre, post)
     */
    setupHooks: function(){
        var self = this;

        Bait.pre(self, 'findOne', self.auth.bind(self, 'findOne'));
        Bait.pre(self, 'find', self.auth.bind(self, 'find'));
        Bait.pre(self, 'create', self.auth.bind(self, 'create'));
        Bait.pre(self, 'update', self.auth.bind(self, 'update'));
        Bait.pre(self, 'remove', self.auth.bind(self, 'remove'));
    },
});


module.exports = ChannelResource;
