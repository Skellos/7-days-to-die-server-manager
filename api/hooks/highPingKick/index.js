const SdtdApi = require('7daystodie-api-wrapper');

/**
 * highPingKick hook
 *
 * @description :: A hook definition.  Extends Sails by adding shadow routes, implicit actions, and/or initialization logic.
 * @docs        :: https://sailsjs.com/docs/concepts/extending-sails/hooks
 */

module.exports = function defineHighPingKickHook(sails) {

  return {

    /**
     * Runs when a Sails app loads/lifts.
     *
     * @param {Function} done
     */
    initialize: function (done) {


      done();

      sails.on('lifted', async () => {

        sails.log.info('Initializing custom hook (`highPingKick`)');

        let enabledConfigs = await SdtdConfig.find({
          pingKickEnabled: true
        });

        for (const configToStart of enabledConfigs) {
          this.start(configToStart.server);
        }



      })
    },


    start: async function (serverId) {

      let server = await SdtdServer.findOne(serverId);

      let loggingObject = sails.hooks.sdtdlogs.getLoggingObject(serverId);

      if (_.isUndefined(loggingObject)) {
        sails.log.warn(`Tried to start ping kicker for a server without a loggingObject - ${server.name}`, {
          server: serverId
        });
        return
      }


      loggingObject.on('memUpdate', handlePingCheck)
    },

    stop: async function (serverId) {

      let loggingObject = sails.hooks.sdtdlogs.getLoggingObject(serverId);

      loggingObject.removeListener('memUpdate', handlePingCheck);
    }

  };

};

async function handlePingCheck(memUpdate) {

  let dateStarted = new Date();

  let server = await SdtdServer.findOne(memUpdate.server.id);
  let config = await SdtdConfig.findOne({
    server: server.id
  });

  let pingWhitelist

  try {
    pingWhitelist = JSON.parse(config.pingWhitelist);
  } catch (error) {
    return sails.log.error(`Error parsing ping whitelist entries for ${server.name}`);
  }

  let onlinePlayers = await SdtdApi.getOnlinePlayers({
    ip: server.ip,
    port: server.webPort,
    adminToken: server.authToken,
    adminUser: server.authName
  });

  let failedChecksForServer = 0;

  if (config.pingKickEnabled) {
    for (const onlinePlayer of onlinePlayers) {

      let playerRecord = await Player.findOne({
        steamId: onlinePlayer.steamid,
        server: server.id
      });

      let whiteListIdx = pingWhitelist.indexOf(playerRecord.steamId);

      if (onlinePlayer.ping > config.maxPing && whiteListIdx === -1) {
        failedChecksForServer++
        let currentFailedChecks = await getPlayerFails(playerRecord.id);

        if (currentFailedChecks >= config.pingChecksToFail) {
          await kickPlayer(playerRecord, server, config.pingKickMessage);
          await setPlayerFails(playerRecord.id, 0);
          sails.log.debug(`Kicked player ${playerRecord.id} from server ${server.name} for high ping! ping = ${onlinePlayer.ping}`)
        } else {
          await setPlayerFails(playerRecord.id, currentFailedChecks + 1)
        }

      } else {
        await setPlayerFails(playerRecord.id, 0);
      }

    }
  }

  let dateEnded = new Date();
  sails.log.verbose(`Performed maxPingCheck for ${server.name} - ${failedChecksForServer} / ${onlinePlayers.length} players failed the check - took ${dateEnded.valueOf() - dateStarted.valueOf()} ms`);

}

async function kickPlayer(player, server, reason) {
  await SdtdApi.executeConsoleCommand({
    ip: server.ip,
    port: server.webPort,
    adminToken: server.authToken,
    adminUser: server.authName,
  }, `kick ${player.steamId} "${reason}"`);
}




function getPlayerFails(playerId) {
  return new Promise(async (resolve, reject) => {

    sails.getDatastore('cache').leaseConnection(function during(redisConnection, proceed) {
      redisConnection.get(`player:${playerId}:failedPingChecks`, (err, reply) => {
        if (err) return proceed(err);

        return proceed(undefined, reply)
      })
    }).exec((err, result) => {
      if (err) return reject(err);
      resolve(parseInt(result));
    })
  })
}

function setPlayerFails(playerId, failedChecks) {
  return new Promise(async (resolve, reject) => {

    sails.getDatastore('cache').leaseConnection(function during(redisConnection, proceed) {
      redisConnection.set(`player:${playerId}:failedPingChecks`, failedChecks, (err, reply) => {
        if (err) return proceed(err);

        return proceed(undefined, reply)
      })
    }).exec((err, result) => {
      if (err) return reject(err);
      resolve(result)
    })


  })
}
