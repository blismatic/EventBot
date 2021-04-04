const Discord = require('discord.js');

module.exports = {
    name: 'rules',
    description: 'Displays the rules of the event.',
    aliases: [''],
    guildOnly: false,
    args: false,
    usage: '<>',
    cooldown: 3,
    execute(message, args) {
        // Do something here.
        const rulesEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Event Rules')
            .setDescription('test');

        message.channel.send(rulesEmbed);
    },
}