'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Bluebird = require('bluebird');
var config = loadConfig();
var inflect = require('i')();

// Inspired by fortune.js
var JSONApiMongo = {

    options: {
        baseUrl: config.serverAddr,
        inflect: true,
        namespace: 'api/v1',
        publicNamespace: 'api/v1/public',
    },

    /**
     * [serialize From response -> db]
     * @param  {[type]} model    [description]
     * @param  {[type]} resource [description]
     * @return {[type]}          [description]
     */
    serialize: function (model, resource) {

        if (resource.hasOwnProperty('id')) {
            resource._id = mongoose.Types.ObjectId(resource.id.toString());
            delete resource.id;
        }
        if (resource.hasOwnProperty('links') && typeof resource.links == 'object') {
            _.each(resource.links, function (value, key) {
                resource[key] = value;
            });
            delete resource.links;
        }
        return resource;
    },

    /**
     * [deserialize From db -> response]
     * @param  {[type]} model    [description]
     * @param  {[type]} resource [description]
     * @return {[type]}          [description]
     */
    deserialize: function(model, resource){
        var json = {};
        var relations = [];

        resource = _.isUndefined(resource.toObject) ? resource : resource.toObject();

        // let's keep to _id s now!!
        json._id = resource._id;

        // check for relationships
        model.schema.eachPath(function (path, type) {

            if (path == '_id' || path == '__v') return;

            json[path] = resource[path];
            var instance = type.instance ||
            (type.caster ? type.caster.instance : undefined);
            if (path != '_id' && instance == 'ObjectID') {
                relations.push(path);
            }

            // check for references inside child schemas (when it is a to-multiple relationship)
            instance = (type.schema && type.schema.paths && type.schema.paths[inflect.singularize(type.path)] ? type.schema.paths[inflect.singularize(type.path)].instance : undefined);
            if (path != '_id' && instance == 'ObjectID') {
                relations.push(path);
            }
        });
        if (relations.length) {
            var links = {};
            _.each(relations, function (relation) {
                if (_.isArray(json[relation]) ? json[relation].length : json[relation]) {
                    links[relation] = json[relation];
                }

                if (_.isArray(links[relation])) {
                    links[relation] = links[relation].map(function(obj){
                        if (_.isPlainObject(obj)){
                            var id = obj[inflect.singularize(relation)] || obj._id;
                            // delete obj[inflect.singularize(relation)];
                            return {
                                _id: id
                                // type: //TODO
                            }; // condition for elasticsearch
                        } else {
                            // in case it was just an id and not an obj
                            return {_id: obj}; // condition for elasticsearch // or condition when there is no separete childSchema
                        }

                    });
                } else if( !_.isEmpty(links[relation]) ) {
                    links[relation] = { _id: links[relation]};
                }
                // delete json[relation]; ///pfff whatever TODOTODO
            });
            if (_.keys(links).length) {
                json.links = links;
            }
        }
        return json;
    },
    /*
    * Append a top level "links" object for hypermedia.
    *
    * @api private
    * @param {Object} body deserialized response body
    * @return {Object}
    */
    appendLinks: function(body, schema) {

        var self = this;
        var options = this.options;

        schema = self._preprocessSchema(schema.tree);

        if(_.isUndefined(schema)) console.log('undefined shit', schema);

        _.each(body, function (value, key) {
            if (key === 'meta') return;


            // var schema = self._schema[options.inflect ? inflect.singularize(key) : key];
            var associations = self.getAssociations.call(self, schema);

            if (!associations.length) return;
            body.links = body.links || {};

            associations.forEach(function (association) {
                var assoc = ((association.singular) ? inflect.singularize(association.type) : association.type);
                var name = [key, assoc].join('.');
                var namespace = options.namespace;

                if(body.meta && _.contains(body.meta.indexed, association.key)) namespace = options.publicNamespace;

                body.links[name] = {
                    href: options.baseUrl + '/' +
                    (!!namespace ? namespace + '/' : '') +
                    association.type + '/{' + name + '}',
                    type: association.type
                };
            });

        });
        return body;
    },


    /*
    * Get associations from a schema.
    *
    * @api private
    * @param {Object} schema
    * @return {Array}
    */
    getAssociations: function (schema) {
        var self = this;
        var associations = [];
        var options = this.options;
        _.each(schema, function (value, key) {
            // is this an embeded schema in an array?
            var checkForRef;

            try {
                checkForRef = _.any(value[0].tree, function(key){ return !!key.ref; });
            } catch (e){
                checkForRef = false;
            }

            if (checkForRef) {
                // yes
                associations.push({
                    key: key,
                    type: key
                });
            } else {
                // nah it is not an embeded schema in an array
                var singular = !_.isArray(value);
                var type = !singular ? value[0] : value;
                type = _.isPlainObject(type) ? type.ref : type;

                if (typeof type === 'string') {
                    type = options.inflect ? inflect.pluralize(type) : type;
                    associations.push({ key: key, type: type, singular: singular });
                }
            }

        });

        return associations;
    },

    _preprocessSchema: function (schema) {
        ['id', 'href', 'links'].forEach(function (reservedKey) {
            if (schema.hasOwnProperty(reservedKey)) {
                delete schema[reservedKey];
                console.warn('Reserved key "' + reservedKey + '" is not allowed.');
            }
        });
        return schema;
    },

};


module.exports = JSONApiMongo;
