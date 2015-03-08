var chance = require('chance')();
var Bait = require('bait');
var Singleton = require('jsclass/src/core').Singleton;
var Resource = dependency('lib', 'resource');
var sandwich = dependency('tests/model', 'sandwich');
/**
 * Testing the resource library
 */
describe('Resource', function() {

    var SandwichResource;
    var preHookExecuted = false;
    var postHookExecuted = false;
    var customMethodExecuted = false;

    before(function(done){

        // Create sandwich resource
        SandwichResource = new Singleton(Resource, {
            name: 'Sandwich',
            schema: sandwich.schema,

            setupHooks: function(){
                var self = this;
                Bait.pre(self, 'findOne', self.preHook.bind(self, 'findOne'));
                Bait.post(self, 'findOne', self.postHook.bind(self, 'findOne'));
            },

            preHook: function(fn, opts){
                preHookExecuted = true;
                return opts;
            },

            postHook: function(fn, opts){
                postHookExecuted = true;
                return opts;
            },

            customMethod: function(){
                customMethodExecuted = true;
                return;
            }
        });

        customMethodExecuted = false;

        sandwich.populate(20)
        .then(function(){
            done();
        })
        .catch(done);

    });

    it('should have basic CRUD methods', function(done){
        var CRUD = ['findOne', 'find', 'create', 'remove', 'update'];
        CRUD.forEach(function(operation){
            SandwichResource[operation].should.be.a.Function;
        });
        done();
    });

    describe('Hooks', function(){

        beforeEach(function(done){
            preHookExecuted = false;
            postHookExecuted = false;

            // Check if hooks have been initiated
            var generatedMethods = ['prefindOnehooks', 'postfindOnehooks', 'originalfindOne'];
            generatedMethods.forEach(function(method){
                SandwichResource[method].should.be.a.Function;
            });
            done();
        });

        it('should execute the pre hook', function(done){
            SandwichResource.findOne({ data: {}, user: {role: ''} })
            .then(function(){
                preHookExecuted.should.be.true;
                done();
            }).catch(done);
        });

        it('should execute the post hook', function(done){
            SandwichResource.findOne({ data: {}, user: {role: ''} })
            .then(function(){
                postHookExecuted.should.be.true;
                done();
            }).catch(done);
        });

        it('should NOT execute hooks on functions without hooks', function(done){
            SandwichResource.find({data: {}, user: {role: ''}})
            .then(function(){
                preHookExecuted.should.be.false;
                postHookExecuted.should.be.false;
                done();
            }).catch(done);
        });

    });

    it('should find a resource', function(done){
        SandwichResource.findOne({ data: {}, user: {role: ''} })
        .get('docs')
        .then(function(res){
            res[0].name.should.be.ok;
            res[0].sauce.should.be.ok;
            done();
        }).catch(done);
    });

    it('should find many resources', function(done){
        SandwichResource.find({ data: {}, user: {role: ''} })
        .get('docs')
        .then(function(res){
            res.forEach(function(sdh){
                sdh.name.should.be.ok;
                sdh.sauce.should.be.ok;
            });
            done();
        }).catch(done);
    });

    it('should create a resource', function(done){
        var id = '';
        var name = chance.word();
        SandwichResource.create({ data:
            {
                name: name,
                sauce: chance.word()
            },
            user: { role: ''}
        })
        .get('docs')
        .then(function(res){
            id = String(res._id);
            return SandwichResource.findOne({
                data: { _id: id }, user: {role: ''}
            });
        })
        .get('docs')
        .then(function(res){
            String(res[0]._id).should.be.equal(id);
            done();
        }).catch(done);
    });


    it('should delete a resource', function(done){
        var doc = '';

        SandwichResource.findOne({ data: {}, user: {role: ''}})
        .get('docs')
        .then(function(res){
            doc = res[0];
            return SandwichResource.remove({ data: {_id: doc._id}, user: {role: ''} });
        })
        .then(function(){
            return SandwichResource.findOne({ data: {_id: doc._id}, user: {role: ''} });
        })
        .get('docs')
        .then(function(res){
            res.should.be.empty;
            done();
        }).catch(done);
    });

    it('should update a resource', function(done){
        var doc = '';
        var newSauce = chance.word() + ' Brown'; // British style

        SandwichResource.findOne({data: {}, user: {role: ''}})
        .get('docs')
        .then(function(res){
            doc = res[0];
            return SandwichResource.update({
                data: {
                    _id: doc._id,
                    sauce: newSauce
                },
                user: { role: ''}
            });
        })
        .then(function(){
            return SandwichResource.findOne({ data: {_id: doc._id}, user: {role: ''} });
        })
        .get('docs')
        .then(function(res){
            res[0].sauce.should.be.equal(newSauce);
            done();
        }).catch(done);
    });

    it('should have custom non-CRUD methods', function(done){
        SandwichResource.customMethod();
        customMethodExecuted.should.be.true;
        done();
    });

    after(function(done){
        sandwich.model.remove({}, function(){
            done();
        });
    });


});

