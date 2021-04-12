const fs = require('fs');
const Discord = require('discord.js');
const config = require('../../config.json');
//let rawConfigData = fs.readFileSync('./config.json');
//let configData = JSON.parse(rawConfigData);

module.exports = {
    name: 'config',
    description: ':x: WARNING :x: setting properties incorrectly\n(i.e. setting the \`basePoints\` property to \`50 points\` instead of just \`50\`, or\n setting the \`armadyl_logo\` property to anything other than an image url)\n may result in breaking the bot. Use at your own risk.',
    aliases: ['c'],
    guildOnly: true,
    usage: 'set <property> <value>',
    cooldown: 2,
    execute(message, args, client) {
        // If the author is not the owner of the guild and does not have the event staff role, dont do anything.
        if ((!message.member.roles.cache.some(role => role.name === config.eventStaffRole)) && (message.guild.ownerID !== message.author.id)) {
            return message.reply('something went wrong, it looks like you don\'t have the right role to do this.')
        }

        if (args.length == 0) {
            return message.channel.send(updateConfigEmbed());
        }

        let property = args[1];
        let value = args.slice(2).join(" ");
        if (property.length != 0) {
            if (property in config) {
                if (value.length != 0) {
                    if ((property == 'basePoints') || (property == 'repeatPointsModifier') || (property == 'timeBetweenTasks') || (property == 'timeBetweenThumbnailSwap')) {
                        config[property] = +value;
                    } else {
                        config[property] = value;
                    }

                    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2), function writeJSON(err) {
                        if (err) return console.log(err);
                    });

                    return message.channel.send(updateConfigEmbed());
                } else {
                    return message.reply(`something went wrong, you must provide a value for \`${property}\``)
                }
            } else {
                return message.reply(`something went wrong, are you sure that \`${property}\` is a property in the config file?`);
            }
        } else {
            return message.reply(`something went wrong, you must provide a \`property\` and a \`value\`.`);
        }
    }
}

function updateConfigEmbed() {
    const configEmbed = new Discord.MessageEmbed().setTitle('Bot / Event Configuration').setTimestamp();
    let configString = '';
    for (property in config) {
        configString += `${property}: ${config[property]}\n`;
        if (property == 'prefix' || property == 'timeBetweenThumbnailSwap' || property == 'submissionsChannel_id') {
            configString += '\n';
        }
    }
    configEmbed.setDescription(configString);

    return configEmbed;
}

function isNumeric(num) {
    return !isNaN(num);
}