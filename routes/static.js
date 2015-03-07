var config = loadConfig();
var Message = dependency('model', 'message');

module.exports = function(app) {
    app.get('/', function(req, res, next){
        Message.find().sort({ created_at: 'desc' }).execAsync()
        .then(function(messages) {
            var data = {};

            if(req.user) {
                data.user = { name: req.user.displayName };
                data.loggedIn = true;
            };

            return res.render('index', data);
        });
    });
}
