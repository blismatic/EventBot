const { submissionsChannel_id } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
    name: 'submit',
    description: 'Submits a drop for the bot to recognize and react to.',
    aliases: [''],
    guildOnly: true,
    args: true,
    usage: '<drop name>',
    cooldown: 3,
    execute(message, args) {
        // Make sure that the command is being sent within the 'submissions' channel
        if (message.channel.id === submissionsChannel_id) {
            message.react('\u0031\u20E3').then(() =>
            message.react('\u0032\u20E3')).then(() => 
            message.react('\u0033\u20E3')).then(() => 
            message.react('\u0034\u20E3')).then(() => 
            message.react('\u0035\u20E3')).then(() =>
            message.react('\u2705')).catch(() => 
            console.error('!submit command: one of the emojis failed to react.'));
        }
    },
}