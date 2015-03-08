/**
 * Checks if the request provided one or multiple ids and routes to the
 * right method in the controller
 * @param  {Object} controller Controller
 */
module.exports =  function(controller) {
    return function(req, res, next){
        var params = req.params._ids.split(',');

        if (params.length === 1) {
            req.params._id = req.params._ids;
            controller.findOne.call(controller, req, res, next);
        } else {
            req.params._ids = params;
            controller.find.call(controller, req, res, next);
        }
    };
};
