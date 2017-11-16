/**
 * View Engine Configuration
 * (sails.config.views)
 *
 * Server-sent views are a classic and effective way to get your app up
 * and running. Views are normally served from controllers.  Below, you can
 * configure your templating language/framework of choice and configure
 * Sails' layout support.
 *
 * For details on available options for configuring server-side views, check out:
 * https://sailsjs.com/config/views
 *
 * For more background information on views and partials in Sails, check out:
 * https://sailsjs.com/docs/concepts/views
 */

module.exports.views = {



    /***************************************************************************
     *                                                                          *
     * Extension to use for your views. When calling `res.view()` in an action, *
     * you can leave this extension off. For example, calling                   *
     * `res.view('homepage')` will (using default settings) look for a          *
     * `views/homepage.ejs` file.                                               *
     *                                                                          *
     ***************************************************************************/

    extension: 'jsx',
    getRenderFn: function() {
        return require('express-react-views').createEngine();
    },

    /***************************************************************************
     *                                                                          *
     * The path (relative to the views directory, and without extension) to the *
     * default layout file to use, or `false` to disable layouts entirely.      *
     *                                                                          *
     * Note that layouts only work with the built-in view engine!               *
     *                                                                          *
     ***************************************************************************/

    layout: 'layout',

    locals: {
        getUserServers: function(req) {
            return req.session.servers;
        },
        loggedInUserID: function(req) {
            return req.session.userId;
        },
        isLoggedIn: function(req) {
            if (_.isUndefined(req.session.userId)) {
                return false;
            } else {
                return true;
            }
        },
        currentServer: function(req) {
            if (_.isUndefined(req.param("serverID"))) {
                return false;
            } else {
                return req.param('serverID');
            }
        }
    },
};