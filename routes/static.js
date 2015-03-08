var config = loadConfig();
var Message = dependency('model', 'message');
var SlackAPI = require('slack-node');

module.exports = function(app, controller) {

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

    app.get('/onboard', function(req, res, next){
        if(!req.user) return res.redirect('/');

        var slack = new SlackAPI(req.user.accessToken);

        slack.api('channels.list', function(err, response){
            var channels = response.channels;

            slack.api('users.list', function(err, response){
                var users = response.members;

                slack.api('groups.list', function(err, response){
                    var groups = response.groups;

                    return res.render('onboard', { user: req.user, channels: channels, users: users, groups: groups });
                });
            });
        });
    });

    app.get('/import/:type/:id', function(req, res, next){
        if(!req.user) return res.redirect('/');

        var user = req.user;
        var slack = new SlackAPI(user.accessToken);
        var params = {
            type: req.params.type,
            id: req.params.id
        };

        fetchMessages(req.params);

        function fetchMessages(params) {
            var method = params.type + '.history';

            var opts = {
                channel: params.id,
                latest: params.latest
            };

            slack.api(params.type + '.history', opts, function(err, response){
                if(err || response.error) {
                    console.log(err);
                    return res.sendStatus(400);
                }

                var messages = response.messages;

                messages.forEach(function(m) {
                    if(m.sub_type === 'file_share' || m.attachments){
                        io.emit('importer-' + user.slackId, m);
                    }
                });

                // Free plan, we've hit the limit
                if(response.is_limited) return res.sendStatus(200);

                // We have more, so recurse
                if(response.has_more) {
                    params.latest = messages[messages.length-1].ts;
                    return fetchMessages(params);
                }

                // If we got here we're done with importing
                return res.sendStatus(200);
            });
        }
    });
}
