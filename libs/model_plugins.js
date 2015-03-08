'use strict';

/**
 * Adds an updated field to the document and a pre-save hook to update
 * the time on save.
 */
 module.exports.addUpdatedField = function(schema, options) {
    schema.path('updated_at', Date);

    schema.pre('save', function(next) {
        this.updated_at = new Date();
        next();
    });
};

//Maps the mongoose model to a flat representation of its attributes.
//ATTENTION: Ignores any referenced Mongoose Models they will be included fully
// TODO recoursively go over the child schemas as well to be able to hide stuff there
// TODO hide stuff optionally on opts.user.role ['admin', 'retail', 'hub', 'elasto', '']
module.exports.toJson = function(schema, options) {
    schema.methods.toJson = function() {
        var dataValues = this;

        var responseObject = this.toObject();
        // Iteration over Schema Paths
        // Schema paths are references to the attribute and reference definitions in mongoose.
        schema.eachPath(function(path) {
            if (schema.path(path).options && schema.path(path).options.to_json === false || path === '__v') {
                // explicitly remove it from the response
                delete responseObject[path];
            }
        });

        responseObject._id = dataValues._id;

        if (dataValues.updated_at) responseObject.updated_at = dataValues.updated_at;

        return responseObject;
    };
};
