/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

/**
 * PASSPORT CONFIGURATION
 */

var passport = require('passport');
var SteamStrategy = require('passport-steam');
var DiscordStrategy = require('passport-discord').Strategy;



/**
 * Steam strategy config
 */

let steamAPIkey = process.env.API_KEY_STEAM;
passport.use(new SteamStrategy({
  returnURL: `${process.env.CSMM_HOSTNAME}/auth/steam/return`,
  realm: `${process.env.CSMM_HOSTNAME}`,
  apiKey: steamAPIkey
}, async function (identifier, profile, done) {
  try {
    let foundUser = await User.findOrCreate({
      steamId: profile._json.steamid
    }, {
        steamId: profile._json.steamid,
        username: profile._json.personaname
      })
    let updatedUser = await User.update({
      id: foundUser.id
    }, {
        username: profile._json.personaname,
        avatar: profile._json.avatarfull
      }).fetch()
    foundUser.steamProfile = profile;
    return done(null, foundUser);
  } catch (error) {
    sails.log.warn(`Error during steam auth!`)
    sails.log.error(error)
    res.send(`Error during steam auth. This should never happen. Please contact someone on the dev server`)
  }

}));

let discordScopes = ['identify', 'guilds'];

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORDCLIENTID,
  clientSecret: process.env.DISCORDCLIENTSECRET,
  callbackURL: `${process.env.CSMM_HOSTNAME}/auth/discord/return`,
  scope: discordScopes
}, async function (accessToken, refreshToken, profile, cb) {
  try {
    return cb(null, profile);
  } catch (error) {
    sails.log.error(`Discord auth error! ${error}`)
  }
}));


passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (steamId, done) {
  User.findOne({
    steamId: steamId
  }, function (err, user) {
    sails.log.error(err);
    done(err, user);
  });
});

/* SENTRY CONFIG */

const Raven = require('raven');
  Raven.config(process.env.SENTRY_DSN, {
    autoBreadcrumbs: {
      'console': true,
    },
    captureUnhandledRejections: true,
  }).install();



module.exports.http = {

  /****************************************************************************
   *                                                                           *
   * Sails/Express middleware to run for every HTTP request.                   *
   * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
   *                                                                           *
   * https://sailsjs.com/documentation/concepts/middleware                     *
   *                                                                           *
   ****************************************************************************/

  middleware: {

    passportInit: require('passport').initialize(),
    passportSession: require('passport').session(),
    ravenRequestHandler: Raven.requestHandler(),
    ravenErrorHandler: Raven.errorHandler(),
    xframe: require('lusca').xframe('SAMEORIGIN'),

    /***************************************************************************
     *                                                                          *
     * The order in which middleware should be run for HTTP requests.           *
     * (This Sails app's routes are handled by the "router" middleware below.)  *
     *                                                                          *
     ***************************************************************************/

    order: [
      'ravenRequestHandler',
      'cookieParser',
      'session',
      'passportInit',
      'passportSession',
      'xframe',
      'bodyParser',
      'compress',
      'poweredBy',
      'router',
      'ravenErrorHandler',
      'www',
      'favicon',
    ],


    /***************************************************************************
     *                                                                          *
     * The body parser that will handle incoming multipart HTTP requests.       *
     *                                                                          *
     * https://sailsjs.com/config/http#?customizing-the-body-parser             *
     *                                                                          *
     ***************************************************************************/

    // bodyParser: (function _configureBodyParser(){
    //   var skipper = require('skipper');
    //   var middlewareFn = skipper({ strict: true });
    //   return middlewareFn;
    // })(),

  },

};
