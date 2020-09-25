const { eventSubmissionsChannelStaff } = require('../config.json');

module.exports = {
    name: 'submit',
    description: 'Submits a completed task to the bot.',
    aliases: ['s'],
    guildOnly: true,
    args: false,
    usage: '',
    cooldown: 3,
    execute(message, args) {
        //message.delete();

        let messageCopy = message;

        //guild.channels.cache.get(eventSubmissionsChannelStaff).send(messageCopy);

        messageCopy.react('\u2705');
        messageCopy.react('\u274E');
    },
}