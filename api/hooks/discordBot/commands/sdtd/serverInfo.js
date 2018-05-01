const Commando = require('discord.js-commando');
const findSdtdServer = require('../../util/findSdtdServer.js');

class ServerInfo extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'serverinfo',
            group: 'sdtd',
            memberName: 'serverinfo',
            guildOnly: true,
            description: '',
            details: "Show info about the server",
        });
    }

    async run(msg, args) {
        let sdtdServer = await findSdtdServer(msg);

        if (!sdtdServer) {
            return msg.channel.send(`Could not determine what server to work with! Make sure your settings are correct.`)
        }

        let serverInfo = await sails.helpers.loadSdtdserverInfo(sdtdServer.id);


        if (!serverInfo || !serverInfo.serverInfo || !serverInfo.stats) {
            return msg.channel.send(`Could not load server data. Make sure the server is online.`)
        }

        // Change data to a nice string
        switch (serverInfo.serverInfo.PlayerKillingMode) {
            case 0:
                serverInfo.serverInfo.PlayerKillingMode = "PvE";
                break;
            case 1:
                serverInfo.serverInfo.PlayerKillingMode = "Kill allies only";
                break;
            case 2:
                serverInfo.serverInfo.PlayerKillingMode = "Kill strangers only";
                break;
            case 3:
                serverInfo.serverInfo.PlayerKillingMode = "PvP";
                break;

        }

        switch (serverInfo.serverInfo.DropOnDeath) {
            case 0:
                serverInfo.serverInfo.DropOnDeath = "Drop all";
                break;
            case 1:
                serverInfo.serverInfo.DropOnDeath = "Belt";
                break;
            case 2:
                serverInfo.serverInfo.DropOnDeath = "Backpack";
                break;
            case 3:
                serverInfo.serverInfo.DropOnDeath = "Delete all";
                break;
        }

        // Update boolean values to emoji

        for (const key in serverInfo.serverInfo) {
            if (serverInfo.serverInfo.hasOwnProperty(key)) {
                const element = serverInfo.serverInfo[key];
                if (typeof element === 'boolean' && element) {
                    serverInfo.serverInfo[key] = ':white_check_mark:'
                }

                if (typeof element === 'boolean' && !element) {
                    serverInfo.serverInfo[key] = ':x:'
                }
            }
        }


        let embed = new this.client.customEmbed();


        embed.setTitle(`${serverInfo.name} - info`)
            .setDescription(serverInfo.serverInfo.ServerDescription)
            .addField('Connect', `${serverInfo.serverInfo.IP}:${serverInfo.serverInfo.Port}`, true)
            .addField(`Gametime`, `${serverInfo.stats.gametime.days} days ${serverInfo.stats.gametime.hours} hours ${serverInfo.stats.gametime.minutes} minutes`, true)
            .addField('Website', `${serverInfo.serverInfo.ServerWebsiteURL ? serverInfo.serverInfo.ServerWebsiteURL : "No website configured"}`)
            .addField('Version', serverInfo.serverInfo.Version)
            .addField('Settings', `
${serverInfo.serverInfo.IsPasswordProtected} Password 
${serverInfo.serverInfo.EACEnabled} EAC 

:small_orange_diamond: Game difficulty:  ${serverInfo.serverInfo.GameDifficulty}
:small_orange_diamond: Day night cycle:  ${serverInfo.serverInfo.DayNightLength}
:small_orange_diamond: Day light length: ${serverInfo.serverInfo.DayLightLength}
:small_orange_diamond: Max zombies:  ${serverInfo.serverInfo.MaxSpawnedZombies}
:small_orange_diamond: Blood moon enemy count:  ${serverInfo.serverInfo.BloodMoonEnemyCount}
:small_orange_diamond: Land claim size: ${serverInfo.serverInfo.LandClaimSize} - Dead zone: ${serverInfo.serverInfo.LandClaimDeadZone} - Expiry date: ${serverInfo.serverInfo.LandClaimExpiryTime}
:small_orange_diamond: Game difficulty:  ${serverInfo.serverInfo.GameDifficulty}
:small_orange_diamond: Drop on death:  ${serverInfo.serverInfo.DropOnDeath}
:small_orange_diamond: Player killing mode:  ${serverInfo.serverInfo.PlayerKillingMode}
:small_orange_diamond: Air drop frequency: ${serverInfo.serverInfo.AirDropFrequency}  hours
:small_orange_diamond: Loot respawns in ${serverInfo.serverInfo.LootRespawnDays} days
`)
            .setColor('RANDOM')

        msg.channel.send(embed)
    }

}


module.exports = ServerInfo;


