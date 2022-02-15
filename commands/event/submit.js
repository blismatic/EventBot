const Discord = require('discord.js');
const config = require('../../config.json');
const { con } = require('../../index.js');

module.exports = {
    name: 'submit',
    description: 'Submits a drop for the bot to recognize and react to.',
    aliases: [''],
    guildOnly: true,
    args: true,
    usage: '<drop name>',
    cooldown: 3,
    channelSpecific: true,
    channelID: config.submissionsChannel_id,
    execute(message, args) {
        const sender = message.author;

        con.execute(`SELECT discord_id, team FROM users WHERE discord_id = ?;`, [sender.id], (err, result, fields) => {
            if (err) throw err;
            if ((result.length == 0) || (result[0].team == null)) {
                message.react('❌');
                return message.reply(`you must be assigned a team in order to submit drops.`);
            } else {
                message.react('\u0031\u20E3').then(() =>
                message.react('\u0032\u20E3')).then(() =>
                message.react('\u0033\u20E3')).then(() =>
                message.react('\u0034\u20E3')).then(() =>
                message.react('\u0035\u20E3')).then(() =>
                message.react('\u2705')).catch(() =>
                console.error('!submit command: one of the emojis failed to react.'));
            }
        });
    },
}