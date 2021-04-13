const Discord = require('discord.js');
const config = require('../../config.json');

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
        message.react('\u0031\u20E3').then(() =>
        message.react('\u0032\u20E3')).then(() =>
        message.react('\u0033\u20E3')).then(() =>
        message.react('\u0034\u20E3')).then(() =>
        message.react('\u0035\u20E3')).then(() =>
        message.react('\u2705')).catch(() =>
        console.error('!submit command: one of the emojis failed to react.'));
    },
}