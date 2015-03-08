'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');

var Bluebird = require('bluebird');

var Class = require('jsclass/src/core').Class;
var AuthError = dependency('lib', 'error').AuthError;
var ValidationError = dependency('lib', 'error').ValidationError;
var inflect = require('inflect');

/**
 * Resource Class
 * @class Definition of a resource. It encapsulates logic related to CRUD actions.
 * It has logic related to authentification. You can declare a new resource the
 * following way.
 *
 * @example
 * var ExampleResource = new Singleton(Resource, { ... });
 */
var Resource = new Class({

    /**
     * Init a resource with the hooks and models
     * @constructs
     */
    initialize: function(app, config, queue) {
        var collectionName = inflect.pluralize(this.name.toLowerCase());
        this.resourceName = collectionName;
        var modelName = inflect.camelize(this.name);
        var model = mongoose.model(modelName, this.schema, collectionName);
        this.model = Bluebird.promisifyAll(model);
        this.queue = queue;
        this.setupHooks();
    },

    setupHooks: function () {},

    props: {
        mongooseActions: ['sort', 'select', 'limit', 'skip', 'populate'] //+ see "elemMatch" below
    },

    /**
     * Find one resource
     * @param  {Object} Options
     * @return {Object} Promise
     */
    findOne: function(opts){
        var self = this;
        opts = self.optsHelper(opts);

        // Implement business logic here
        return self.model.find(opts.data).limit(1).execAsync()
            .then(function(docs){
                opts.docs = docs;
                return opts;
            });
    },

    /**
     * Find multiple resources
     * @param  {Object} Options
     * @return {Promise} Options
     */
    find: function(opts){
        var self = this;
        opts = self.optsHelper(opts);

        if(opts && _.isUndefined(opts.data)) throw new Error('No opts.data for find');

        var queryOpts = opts.queryOpts || {};
        var query = self.model.find(opts.data);
        var count = self.model.count(opts.data);

        if (queryOpts.elemMatch) {
            var path = _.keys(queryOpts.elemMatch)[0];
            var match = queryOpts.elemMatch[path];
            query = query.elemMatch(path, match);
            count = count.elemMatch(path, match);
        }

        // Apply queryOpts like field, limit etc to the mongo query
        self.props.mongooseActions.forEach(function(action){
            if (queryOpts.hasOwnProperty(action)) {
                query[action].apply(query, [queryOpts[action]]);
            }
        });

        return query.execAsync()
            .then(function(docs){
                opts.docs = docs;
            })
            .then(function(){
                if (queryOpts.limit) {
                    return count.execAsync();
                } else {
                    return null;
                }
            })
            .then(function(res){
                if (res) opts.meta = {
                    total: res
                };
            })
            .thenReturn(opts);
    },

    /**
     * Create a new document
     * @param  {Object} doc New document
     * @return {Object}     Promise
     */
    create: function(opts){
        var self = this;
        opts = self.optsHelper(opts);

        return self.model.createAsync(opts.data)
            .then(function(docs){
                opts.docs = docs;
                return opts;
            });
    },

    /**
     * Update
     * @param  {Object} Options
     * @return {Object} Promise
     */
    update: function(opts){
        if(opts && ( _.isUndefined(opts.data) || _.isUndefined(opts.data._id) )) throw new ValidationError('No data in request');

        opts = this.optsHelper(opts);

        var id = opts.data._id;
        delete opts.data._id; // remove the _id key in the opts

        // "Note that findAndUpdate/Remove do not execute any hooks or validation before making the change in the database."
        // so we have to use model.save()

        // to avoid confusion this method only overrides
        // only those attributes of the document that are provided in the opts.data
        // and won't override the whole doc
        // attributes from opts.data that are not in the schema will NOT be saved
        return this.model
            .findOne({ _id: id }).execAsync()
            .then(function (doc) {
                // once again: mongoose makes sure that attributes from opts.data
                // that are not in the schema
                // will NOT be merged into the doc
                // eg: doc.whatever = 'lala' only worsks if "whatever" is in the schema :P
                if (!doc) throw new ValidationError('No such document');
                return _.extend(doc, opts.data);
            })
            .then(function(doc){
                return new Bluebird(function(resolve, reject){
                    return doc.save(function(err, dbDoc){
                        if (err) return reject(err);
                        resolve(dbDoc);
                    });
                });
            })
            .then(function(docs){
                opts.docs = docs;
                return opts;
            });
    },

    /**
     * Remove
     * @param  {Object} Options
     * @return {Object} Promise
     */
    remove: function(opts){
        opts = this.optsHelper(opts);

        return this.model.remove(opts.data).execAsync()
            .then(function(docs){
                opts.docs = docs;
                return opts;
            });
    },

    /**
     * Authentification system that refects requests without the right permission
     * @param  {String} fn   [Function name]
     * @param  {Object}   opts [Options]
     * @return {Object} Promise
     */
    auth: function(fn, opts){
        var self = this;
        opts = self.optsHelper(opts);

        var check = {
            permissions: self.permissions,
            name: self.name,
            opts: opts,
            fn: fn
        };

        return self.authHelper(check);
    },
    /**
     * Offloaded the auth logic to authHelper to be able to call it directly from resource if needed
     * @param  {[type]} check [{name:'', opts: {}, permissions: [], fn: '',}]
     * @return {[Promise]}       [description]
     */
    authHelper: function(check){
        var self = this;
        var opts = check.opts;
        var name = check.name;
        var permissions = check.permissions;
        var fn = check.fn;
        var errorMessage;

        if(_.isUndefined(permissions[fn])) {
            errorMessage = ["No permissions defined in the model:", name, "and method:", fn].join(' ');
        } else if((_.isUndefined(opts.user) || _.isUndefined(opts.user.role)) && !_.contains(permissions[fn], 'all')) {
            errorMessage = ["No role given in the model:", name, "and method:", fn].join(' ');
        }

        if( _.isUndefined(errorMessage) &&
            ( _.contains(permissions[fn], opts.user.role) ||
              _.contains(permissions[fn], 'all') ) ){
            return Bluebird.resolve(opts);
        }

        throw new AuthError(errorMessage || self.name +'.'+ fn+" not permitted for "+opts.user.role);
    },

    optsHelper: function(opts){
        try {
            if (typeof opts.data === 'object' && typeof opts.user === 'object') return opts;
            else throw new Error('Opts is UNDEFINED!');
        } catch (e) {
            throw new Error('Opts is UNDEFINED!');
        }
    }

});

module.exports = Resource;
