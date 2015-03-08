var _ = require('lodash');
var chance = require('chance')();
var Bluebird = require('bluebird');
var mongoose = require('mongoose');
var Class = require('jsclass/src/core').Class;
var Singleton = require('jsclass/src/core').Singleton;

var chai = require('chai');
var expect = require('chai').expect;
chai.should();
chai.use(require('chai-as-promised'));

var Resource = dependency('lib', 'resource');
var ResourceController = dependency('lib', 'resource_controller');
var sandwich = dependency('tests/model', 'sandwich');

/**
 * Testing the controller library
 */
describe('Controller', function() {

    var customMethodExecuted = false;

    var SandwichController = null;
    var SandwichResource = null;
    var collection = '';
    var availableSandwiches = [];

    // To test the controllers you need to have res and req objects
    var req = {};
    var res = {
        header: []
    };

    beforeEach(function(done){
        // mock req, res
        req = {
            params: {
            },
            query: {
            }
        };
        res = {
            header: []
        };
        res.send = function(status, data){
            return {
                status: status,
                data: data
            };
        };
        res.set = function(){}; // does nothing
        customMethodExecuted = false;

        // cleanup
        mongoose.models = {};
        mongoose.modelSchemas = {};

        // mock resource
        collection = 'sandwiches';

        // Create sandwich resource
        SandwichResource = new Singleton(Resource, {
            name: 'Sandwich',
            schema: sandwich.schema
        });

        SandwichController = new Class(ResourceController, {
            customMethod: function(){
                customMethodExecuted = true;
                return;
            }
        });

        SandwichController = new SandwichController(SandwichResource, 'sandwiches');

        sandwich.populate(20)
        .then(function(res){
            availableSandwiches = res;
            done();
        });

    });

    it('should have initialized the resource and collection', function(done){
        SandwichController.resource.should.be.ok;
        SandwichController.collection.should.be.ok;
        done();
    });


    it('should have basic CRUD methods', function(done){
        var CRUD = ['findOne', 'find', 'create', 'remove', 'update'];
        CRUD.forEach(function(operation){
            SandwichController[operation].should.be.a.Function;
        });
        done();
    });

    it('should find a resource', function(done){
        req.params = {
            _id: availableSandwiches[0]._id
        };

        SandwichController.findOne(req, res).then(function(res){
            res.status.should.be.equal(200);
            res.data[collection].should.not.be.empty;
            res.data[collection][0].name.should.be.ok;
            res.data[collection][0].sauce.should.be.ok;
        })
        .should.eventually.notify(done);

    });

    it('should find many resources', function(done){
        req.params = { };
        SandwichController.find(req, res)
        .then(function(res){

            res.status.should.be.equal(200);
            res.data[collection].should.not.be.empty;

            res.data.sandwiches.forEach(function(sdh){
                sdh.name.should.be.ok;
                sdh.sauce.should.be.ok;
            });
            done();
        }).catch(done);
    });

    it('should create a resource', function(done){
        req.body = {
            name: chance.name(),
            sauce: chance.word()
        };

        var _id = '';

        SandwichController.create(req, res)
        .then(function(response){
            _id = String(response.data[collection][0]._id);
            req = {
                params: {
                    _id: _id
                },
                query: {}
            };
            return SandwichController.findOne(req, res);
        })
        .then(function(response){
            String(response.data[collection][0]._id).should.be.equal(_id);
            done();
        }).catch(done);
    });


    it('should delete a resource', function(done){

        SandwichController.findOne({
            params: {
                _id: availableSandwiches[0]._id
            },
            query: {}
        }, res)
        .then(function(res){
            expect(res.data).to.have.property('sandwiches').that.is.an('array').with.length(1);
            expect(res.data.sandwiches[0]).to.have.a.property('_id').eql(availableSandwiches[0]._id);
        })
        .then(function(){
            return SandwichController.remove({
                params: {
                    _id: availableSandwiches[0]._id
                },
                query: {}
            }, res);
        })
        .then(function(){
            return SandwichController.findOne({
                params: {
                    _id: availableSandwiches[0]._id
                },
                query: {}
            }, res);
        })
        .then(function(res){
            expect(res.data).to.have.property('sandwiches').that.is.an('array').with.length(0);
        })
        .then(done.bind(this, null), done);
    });

    it('should update a resource', function(done){

        var newSauce = chance.word() + ' Brown'; // British style
        var req = {
            params: {
                _id: availableSandwiches[1]._id
            },
            query: {}
        };

        SandwichController.findOne(req, res)
        .then(function(res){
            expect(res.data).to.have.property('sandwiches').that.is.an('array').with.length(1);
            expect(res.data[collection][0]._id).to.eql(availableSandwiches[1]._id);
        })
        .then(function(){
            req.body = {
                sauce: newSauce
            };
            return SandwichController.update(req, res);
        })
        .then(function(){
            req = {
                params: {
                    _id: availableSandwiches[1]._id
                },
                query: {}
            };
            return SandwichController.findOne(req, res);
        })
        .then(function(res){
            expect(res.data).to.have.property('sandwiches').that.is.an('array').with.length(1);
            expect(res.data[collection][0]._id).to.eql(availableSandwiches[1]._id);
            res.data[collection][0].sauce.should.be.equal(newSauce);
        })
        .then(done.bind(this, null), done);

    });

    it('should have custom non-CRUD methods', function(done){
        SandwichController.customMethod();
        customMethodExecuted.should.be.true;
        done();
    });


    describe('Query params', function(){

        it('should handle paging', function(done){
            var size = 4;

            req = {
                params: { },
                query: {
                    page: 1,
                    limit: size
                }
            };
            var sameObj = 0;

            var firstQuery = [];

            SandwichController.find(req, res)
            .then(function(response){
                firstQuery = response.data[collection].map(function(obj){
                    return String(obj._id);
                });

                req.query = {
                    page: 2,
                    limit: size-1
                };

                return SandwichController.find(req, res);
            })
            .then(function(response){
                var data = response.data[collection];
                data.forEach(function(obj){
                    if(_.contains(firstQuery, String(obj._id))) sameObj += 1;
                });
                sameObj.should.be.equal(1);
            })
            .should.eventually.notify(done);
        });

        it('should get one field', function(done){
            req.query = {
                fields: 'sauce'
            };

            SandwichController.find(req, res)
            .then(function(response){
                response.data[collection].forEach(function(sdh){
                    sdh.sauce.should.be.ok;
                    (sdh.name === undefined).should.be.true;
                    (sdh.price === undefined).should.be.true;
                });
            })
            .should.eventually.notify(done);
        });

        it('should get multiple fields', function(done){
            req.query = {
                fields: 'sauce,name'
            };

            SandwichController.find(req, res)
            .then(function(response){
                response.data[collection].forEach(function(sdh){
                    sdh.sauce.should.be.ok;
                    sdh.name.should.be.ok;
                    (sdh.price === undefined).should.be.true;
                });
            })
            .should.eventually.notify(done);
        });

        it('should sort by field', function(done){
            req.query = {
                sort: 'price'
            };
            var sorted = true;

            SandwichController.find(req, res)
            .then(function(response){
                var data = response.data[collection];
                data.forEach(function(obj, i){
                    if(i === 0 || i === data.length-1) return;
                    if(data[i].price > data[i+1].price) sorted = false;
                });

                sorted.should.be.true;
            })
            .should.eventually.notify(done);
        });

        it('should get objects by ids', function(done){
            var ids = _.map(availableSandwiches, '_id');
            var req = {
                params: {
                    _ids: ids
                },
                query: {}
            }
            SandwichController.find(req, res)
            .then(function(res){
                expect(res.data).to.have.property('sandwiches').that.is.an('array').with.length(availableSandwiches.length);
            })
            .then(done.bind(this, null), done);


        });

        it('should limit the number of objects', function(done){
            var limit = chance.integer({min: 1, max: 8});

            req = {
                query: {
                    limit: limit
                },
                params: { }
            };

            SandwichController.find(req, res)
            .then(function(response){
                var data = response.data[collection];
                data.length.should.be.equal(limit);
            })
            .should.eventually.notify(done);
        });

    });

    after(function(done){
        sandwich.model.remove({}, function(){
            done();
        });
    });
});
