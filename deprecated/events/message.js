const Discord = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'message',
    execute(message, client) {
        const cooldowns = new Discord.Collection();

        if (!message.content.startsWith(config.prefix) || message.author.bot) return;

        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName)
            || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) return;

        if (command.guildOnly && message.channel.type === 'dm') {
            return message.reply('I can\'t execute that command inside DMs!');
        }

        if (command.args && !args.length) {
            let reply = `You didn't provide any arguments, ${message.author}!`;

            if (command.usage) {
                reply += `\nThe proper usage would be: \`${config.prefix}${command.name} ${command.usage}\``
            }

            return message.channel.send(reply);
        }

        if (command.eventStaffSpecific && !(message.member.roles.cache.some(role => role.name === config.eventStaffRole))) {
            return message.reply(`sorry, you need to have the ${config.eventStaffRole} role to use this command.`);
        }

        if (command.channelSpecific && !(message.channel.id === command.channelID)) {
            return message.reply(`sorry, this command can only be used in ${message.guild.channels.cache.get(command.channelID)}`);
        }

        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Discord.Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
            }
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        try {
            command.execute(message, args);
        } catch (error) {
            console.error(error);
            message.reply('there was an error trying to execute that command!');
        }
    },
};