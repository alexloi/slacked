var config = loadConfig();
var Record = dependency('model', 'record');

module.exports = function(app) {
    app.get('/', function(req, res, next){
        Record.find().sort({ created_at: 'desc' }).execAsync()
        .then(function(records) {
            var data = {
                config: { pusherPublic: config.pusher.public },
                records: records,
                loggedIn: false
            };

            if(req.user) {
                data.user = { name: req.user.displayName };
                data.loggedIn = true;
            };

            return res.render('index', data);
        });
    });
}
