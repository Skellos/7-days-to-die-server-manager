const sevenDays = require('machinepack-7daystodiewebapi');

module.exports = {


  friendlyName: 'Update connection info',


  description: 'Update ip, port, authname and/or authtoken for a sdtdServer',


  inputs: {
    serverId: {
      required: true,
      type: 'string'
    },
    serverIp: {
      type: 'string',
    },

    webPort: {
      type: 'number',
    },

    authName: {
      type: 'string',
    },

    authToken: {
      type: 'string',
    },
    serverName: {
      type: 'string'
    }
  },


  exits: {

    notFound: {
      description: 'Server with given ID not found in the system',
      responseType: 'notFound'
    },
    success: {}

  },

  /**
   * @memberof SdtdServer
   * @name update-connection-info
   * @method
   * @description Updates basic connection info for a server in the DB
   * @param {string} serverId
   * @param {string} serverIp
   * @param {number} webPort
   * @param {string} authName
   * @param {string} authToken
   */


  fn: async function (inputs, exits) {

    try {
      
      let server = await SdtdServer.findOne(inputs.serverId);
      
      let ip = ('' == inputs.serverIp) ? server.ip : inputs.serverIp;
      let webPort = ('' == inputs.webPort) ? server.webPort : inputs.webPort;
      let serverName = ('' == inputs.serverName) ? server.name : inputs.serverName;
      
      await SdtdServer.update({
        id: inputs.serverId
      }, {
        ip: ip,
        webPort: webPort,
        name: serverName
      });
      
      if (inputs.webPort || inputs.serverIp) {
        await sails.hooks.sdtdlogs.stop(inputs.serverId);
        await sails.hooks.sdtdlogs.start(inputs.serverId);
      }
      sails.log.info(`API - SdtdServer:update-connection-info - Updated connection info for server ${inputs.serverId}`, inputs);
      return exits.success();
    } catch (error) {
      sails.log.error(`API - SdtdServer:update-connection-info - ${error}`);
      return exits.error(error);
    }


  }


};
