/**
 * Model for the tests
 * Using a sandwich for testing
 *
 *            .----------'    '-.
 *           /  .      '     .   \\
 *          /        '    .      /|
 *         /      .             \ /
 *        /  ' .       .     .  || |
 *       /.___________    '    / //
 *       |._          '------'| /|
 *       '.............______.-' /
 *       |-.                  | /
 *       `"""""""""""""-.....-'
 *
 */

var mongoose = require('mongoose');
var Bluebird = require('bluebird');
var chance = require('chance')();
var plugins = dependency('lib', 'model_plugins');

Bluebird.promisifyAll(mongoose);

// Kinda redundant, but needed
var Schema = require('mongoose').Schema;

// Mongoose schema so Mongoose can make effective queries
var sandwichSchema = new Schema({
    name : { type: String, index: { unique: true, required: true }},
    sauce : { type: String, default: 'Ketchup'},
    price : { type: Number, default: 5}
});
sandwichSchema.plugin(plugins.toJson);

// Declaring a private model for internal methods
var model = mongoose.model('sandwich', sandwichSchema);

var populate = function(total){

    // Populate database with random sandwiches - Sounds yummy
    var modelTotal = total || 10;
    var promiseArray = [];

    for (var i = 0; i < modelTotal; i++) {
        var name = chance.name();
        var sauce = chance.word();
        var price = chance.integer();

        promiseArray.push(
            model.createAsync({
                name: name,
                sauce: sauce,
                price: price
            })
        );
    }

    return model.removeAsync({}) // Clean and populate
    .then(function(){
        return Bluebird.all(promiseArray);
    });

};

var Sandwich = {
    schema: sandwichSchema,
    model: model,
    populate: populate
};

module.exports = Sandwich;
