module.exports = {


  friendlyName: 'Update Timeout',


  description: '',


  inputs: {
    commandId: {
      type: 'number',
      required: true
    },

    newOutput: {
      type: 'boolean',
    },

  },


  exits: {
    success: {}
  },


  fn: async function (inputs, exits) {

    try {
      await CustomCommand.update({
        id: inputs.commandId,
      }, {
        sendOutput: inputs.newOutput
      })
      return exits.success();

    } catch (error) {
      sails.log.error(error)
    }

  }


};
