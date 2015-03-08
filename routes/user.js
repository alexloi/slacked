'use strict';

var routeFindMiddleware = dependency('middleware', 'route_find');
var apiPath = dependency('lib', 'helpers').apiPath;

/**
 * user routes
 * @param  {Object} app Express app
 */
module.exports = function(app, controller) {
    /**
     * @api {get} /users/ Find Users
     * @apiName FindUsers
     * @apiGroup User
     *
     * @apiDescription Throws AuthError
     */
    app.get(apiPath('users'), controller.index.bind(controller));

    /**
     * @api {get} /users/:_ids Retrieve Users by id
     * @apiName RetrieveUsers
     * @apiGroup User
     * @apiPermission admin, retail, hub
     *
     * @apiDescription Only admin can find multiple ids
     *
     * @apiStructure ResourceFindByIds
     *
     * @apiSuccess {Array}  users       List of all the found users
     * @apiErrorStructure ResourceError
     */
    app.get(apiPath('users/:_ids'), routeFindMiddleware(controller));

    /**
     * @api {post} /users/ Create User
     * @apiName CreateUser
     * @apiGroup User
     * @apiPermission admin, retail
     *
     * @apiParam {String} email     Email
     * @apiParam {String} role     Role (`hub`, `retail`)
     * @apiParam {String} password     Password
     * @apiParam {String} password_confirmation     Password confirmation
     *
     * @apiErrorStructure ResourceError
     */
    app.post(apiPath('users'), controller.create.bind(controller) );

    /**
     * @api {put} /users/:_id Update User
     * @apiName UpdateUser
     * @apiGroup User
     * @apiPermission admin, retail
     *
     * @apiSuccess {Array}  users       The updated user
     * @apiErrorStructure ResourceError
     */
    app.put(apiPath('users/:_id'), controller.update.bind(controller) );

    // ACTIONS

    /**
     * @api {post} /signup/ Signup User
     * @apiName SignupUser
     * @apiGroup User
     * @apiPermission all
     *
     * @apiParam {String} email     Email
     * @apiParam {String} role     Role (`hub`, `retail`)
     * @apiParam {String} password     Password
     * @apiParam {String} password_confirmation     Password confirmation
     *
     * @apiErrorStructure ResourceError
     */
    app.post(apiPath('signup'), controller.signup.bind(controller));

    /**
     * @api {post} /login/ Login User
     * @apiName LoginUser
     * @apiGroup User
     * @apiPermission all
     * @apiParam {String} email     Email
     * @apiParam {String} password     Password
     *
     * @apiErrorStructure ResourceError
     */
    app.post(apiPath('login'), controller.login.bind(controller));

    /**
     * @api {post} /forgot/ Forgot User Password
     * @apiName ForgotUser
     * @apiGroup User
     * @apiPermission all
     *
     * @apiParam {String} email     Email
     *
     * @apiErrorStructure ResourceError
     */
    app.post(apiPath('forgot'), controller.forgot.bind(controller));

    /**
     * @api {post} /reset/ Reset User Password
     * @apiName ResetUserPassword
     * @apiGroup User
     * @apiPermission all
     *
     * @apiParam {String} forgot_password_token     Forgot password token
     * @apiParam {String} new_password     New password
     *
     * @apiErrorStructure ResourceError
     */
    app.post(apiPath('reset'), controller.reset.bind(controller));

    /**
     * @api {get} /logout/ Logout user
     * @apiName LogoutUser
     * @apiGroup User
     * @apiPermission all
     *
     * @apiParam {String} forgot_password_token     Forgot password token
     * @apiParam {String} new_password     New password
     *
     * @apiErrorStructure ResourceError
     */
    app.get(apiPath('logout'), controller.logout.bind(controller));

    /**
     * @api {get} /isloggedin/ Is logged in
     * @apiName IsLoggedInUser
     * @apiGroup User
     * @apiPermission all
     *
     * @apiDescription Returns the data of the current logged in user.
     *
     * @apiParam {Object} User     Current user object
     * @apiParam {Boolean} isLoggedIn     Is logged in flag
     *
     */
    app.get(apiPath('isloggedin'), controller.isloggedin.bind(controller));

    /**
     * @api {get} /auth/slack Slack authentication
     * @apiName SlackAuthUser
     * @apiGroup User
     * @apiPermission all
     *
     * @apiDescription Auth user via Slack.
     *
     */
    app.get('/auth/slack', controller.slackAuth.bind(controller));

    /**
     * @api {get} /auth/slack/callback Slack handler
     * @apiName SlackAuthUser
     * @apiGroup User
     * @apiPermission all
     *
     * @apiDescription Slac Callback handler
     */
    app.get('/auth/slack/callback', controller.slackHandler.bind(controller));

};
