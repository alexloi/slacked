/**
 * controller.js
 */
'use strict';

var Class = require('jsclass/src/core').Class;
var Controller = require('./controller');
var _ = require('lodash');
var JSONApiMongo = require('./jsonapi_mongo');
var helpers = dependency('lib', 'helpers');
var ErrorTypes = dependency( 'lib', 'error');
var AuthError = ErrorTypes.AuthError;
var ValidationError = ErrorTypes.ValidationError;
var PaymentError = ErrorTypes.PaymentError;
var ArrayCastError = ErrorTypes.ArrayCastError;
var MongooseError = ErrorTypes.MongooseError;
var CardError = ErrorTypes.CardError;
var errorHandlers = dependency('lib', 'controller_error');
var config = loadConfig();
var inflect = require('inflect');

/**
 * [Controller Base class for controllers]
 */
var ResourceController = new Class(Controller, {
    // constants
    MIME: {
        standard: 'application/vnd.api+json',
        patch: 'application/json-patch+json'
    },

    /**
     * [initialize the constructor]
     * @param  {resource} a resource instance
     * @return {this}
     */
    initialize: function(resource){
        this.resource = resource;
        this.collection = resource.resourceName;
    },

    /**
     * [find find multiple objects]
     * @param  {Object} req [Request]
     * @param  {Object} res [Response]
     * @return {Object}     [Promise]
     */
    findOne: function(req, res){
        var self = this;

        var parsedQuery = self._queryOptsFromQuery(req.query);
        var opts = {
            data: _.merge({ _id: req.params._id }, parsedQuery.data),
            user: req.user || { role: ''}
        };

        return self.resource
                .findOne(opts)
                .then(function(opts){
                    var data = _.invoke(opts.docs, 'toJson');
                    // var data = opts.docs;

                    var response = {};

                    // Add individual links in each object
                    response[self.collection] = data.map(function(obj){
                        return JSONApiMongo.deserialize(self.resource.model, obj);
                    });

                    // Add general links in the collection
                    response = JSONApiMongo.appendLinks(response, self.resource.model.schema);
                    if (opts.meta) response.meta = opts.meta;
                    res.set('Content-Type', self.MIME.standard);
                    return res.send(200, response); // SEND THAT SHIT
                })
                // auth errors
                .catch(AuthError, errorHandlers.handleAuthError.bind(self, res, 'findOne'))
                // mongoose validation errors, cast to ObjectId errors and other fancyness
                .catch(ValidationError, ArrayCastError, MongooseError, errorHandlers.handleMongooseError.bind(self, res, 'findOne'))
                // programmer errors
                .catch(TypeError, ReferenceError, errorHandlers.handleProgrammerError.bind(self, res, 'findOne'))
                // all other errros
                .catch(errorHandlers.handleServerError.bind(self, res, 'findOne'));
    },

    /**
     * [find Find one object]
     * @param  {Object} req [Request]
     * @param  {Object} res [Response]
     * @return {Object}     [Promise]
     */
    find: function(req, res){
        var self = this;

        var parsedQuery = self._queryOptsFromQuery(req.query);
        var opts = {
            user: req.user || { role: ''},
            data: _.merge(self._queryFromParams(req.params), parsedQuery.data),
            queryOpts: parsedQuery.queryOpts
        };

        return self.resource
                .find(opts) // Returns an array
                .then(function(opts){
                    var data = _.invoke(opts.docs, 'toJson');

                    var response = {};

                    // Add individual links in each object
                    response[self.collection] = data.map(function(obj){
                        return JSONApiMongo.deserialize(self.resource.model, obj);
                    });

                    // Add general links in the collection
                    response = JSONApiMongo.appendLinks(response, self.resource.model.schema);
                    if (opts.meta) response.meta = opts.meta;
                    res.set('Content-Type', self.MIME.standard);
                    return res.send(200, response);
                })
                // auth errors
                .catch(AuthError, errorHandlers.handleAuthError.bind(self, res, 'find'))
                // mongoose validation errors, cast to ObjectId errors and other fancyness
                .catch(ValidationError, ArrayCastError, MongooseError, errorHandlers.handleMongooseError.bind(self, res, 'find'))
                // programmer errors
                .catch(TypeError, ReferenceError, errorHandlers.handleProgrammerError.bind(self, res, 'find'))
                // all other errros
                .catch(errorHandlers.handleServerError.bind(self, res, 'find'));
    },

    /**
     * [_queryFromParams Builds a query when find]
     * @param  {Object}   opts
     * @return {Object}        New options
     */
    _queryFromParams: function(params){

        var newOpts = {};

        for (var key in params) {
            newOpts[key] = params[key];
        }

        // if array of ids
        if(params._ids && params._ids.length > 1){
            newOpts._id = {
                $in: params._ids
            };

            delete params._ids;
            delete newOpts._ids;
        }

        return newOpts;
    },

    _queryOptsFromQuery: function(query){
        var newOpts = {};

        if(query.fields) newOpts.select = query.fields.replace(/,/g, ' ');
        if(query.limit) newOpts.limit = query.limit;
        if(query.skip) newOpts.skip = query.skip;
        if(query.match) newOpts.elemMatch = query.match;
        if(query.populate) newOpts.populate = query.populate.replace(/,/g, ' ');

        if(query.page){ // unefficient but works TODO: make efficient
            newOpts.limit = query.limit || 20;
            newOpts.skip = parseInt(query.page, 10) * parseInt(newOpts.limit, 10) - parseInt(newOpts.limit, 10);
        }

        if(query.sort) {
            newOpts.sort = {};
            if (query.sort.indexOf('-') !== -1) {
                newOpts.sort[query.sort.replace('-', '')] = -1;
            } else {
                newOpts.sort[query.sort] = 1;
            }
        }

        if(query.q) {
            _.each(query.q, function (value, key) {
                query[key] = new RegExp(value, 'gi');
            });
        }

        delete query.q;
        delete query.fields;
        delete query.limit;
        delete query.skip;
        delete query.match;
        delete query.page;
        delete query.match;
        delete query.sort;
        delete query._; //remove jquery cacheBust!
        delete query.device;
        delete query.v;
        delete query.defaultPage;
        delete query.populate;

        return {
            queryOpts: newOpts,
            data: query
        };
    },

    /**
     * [create Create a new resource]
     * @return {Object}     [Promise]
     */
    create: function(req, res){
        var self = this;

        var opts = {
            data: req.body || {},
            user: req.user || { role: ''}
        };

        var query = req.query || {};
        opts.convertPrices = query.v === '2' && query.device === 'mobile';

        return self.resource
                .create(opts)
                .then(function(opts){

                    var data = opts.docs.toJson ? opts.docs.toJson() : opts.docs;

                    var newData = _.isArray(data) ? data : [data];
                    var response = {};

                    // Add individual links in each object
                    response[self.collection] = newData.map(function(obj){
                        return JSONApiMongo.deserialize(self.resource.model, obj);
                    });

                    // Add general links in the collection
                    response = JSONApiMongo.appendLinks(response, self.resource.model.schema);
                    if (opts.meta) response.meta = opts.meta;
                    res.set('Content-Type', self.MIME.standard);
                    res.set('Location', [config.serverAddr + helpers.apiPath(self.resource.resourceName), data._id].join('/'));
                    return res.send(201, response);
                })
                // auth errors
                .catch(AuthError, errorHandlers.handleAuthError.bind(self, res, 'create'))
                // mongoose validation errors, cast to ObjectId errors and other fancyness
                .catch(ValidationError, ArrayCastError, MongooseError, errorHandlers.handleMongooseError.bind(self, res, 'create'))
                // programmer errors
                .catch(TypeError, ReferenceError, errorHandlers.handleProgrammerError.bind(self, res, 'create'))
                // all other errros
                .catch(errorHandlers.handleServerError.bind(self, res, 'create'));
    },

    /**
     * [update Update a resource]
     * @return {Object}     [Promise]
     */
    update: function(req, res){
        var self = this;

        var opts = {
            data: req.body || {},
            user: req.user || { role: ''}
        };
        opts.data._id = req.params._id;

        return self.resource.update(opts)
        .then(function(opts){
            var data = opts.docs.toJson();

            var newData = _.isArray(data) ? data : [data];
            var response = {};

            // Add individual links in each object
            response[self.collection] = newData.map(function(obj){
                return JSONApiMongo.deserialize(self.resource.model, obj);
            });

            // Add general links in the collection
            response = JSONApiMongo.appendLinks(response, self.resource.model.schema);
            if (opts.meta) response.meta = opts.meta;
            res.set('Content-Type', self.MIME.standard);
            return res.send(200, response);
        })
        // auth errors
        .catch(AuthError, errorHandlers.handleAuthError.bind(self, res, 'update'))
        // mongoose validation errors, cast to ObjectId errors and other fancyness
        .catch(ValidationError, ArrayCastError, MongooseError, errorHandlers.handleMongooseError.bind(self, res, 'update'))
        // programmer errors
        .catch(TypeError, ReferenceError, errorHandlers.handleProgrammerError.bind(self, res, 'update'))
        // all other errros
        .catch(errorHandlers.handleServerError.bind(self, res, 'update'));
    },


    /**
     * [remove remove a category]
     * @return {Function}     Response
     */
    remove: function(req, res){
        var self = this;

        var opts = {
            data: req.body || {},
            user: req.user || { role: ''}
        };
        opts.data._id = req.params._id;

        return self.resource.remove(opts)
        .then(function(opts){
            if(opts.docs === 0) throw new ValidationError("The remove was unsoccessful because it didn't match any document");
            // JSON api spec for delete
            return res.send(204);
        })
        // auth errors
        .catch(AuthError, errorHandlers.handleAuthError.bind(self, res, 'remove'))
        // mongoose validation errors, cast to ObjectId errors and other fancyness
        .catch(ValidationError, ArrayCastError, MongooseError, errorHandlers.handleMongooseError.bind(self, res, 'remove'))
        // programmer errors
        .catch(TypeError, ReferenceError, errorHandlers.handleProgrammerError.bind(self, res, 'remove'))
        // all other errros
        .catch(errorHandlers.handleServerError.bind(self, res, 'remove'));
    },


});

module.exports = ResourceController;
