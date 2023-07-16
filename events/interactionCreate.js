const { Collection, Events } = require('discord.js');
// const config = require('../../config.json');
const config = require('../config.json')

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        // Deal with cooldowns
        const { cooldowns } = interaction.client;

        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 3;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

            if (now < expirationTime) {
                const expiredTimestamp = Math.round(expirationTime / 1000);
                return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>`, ephemeral: true });
            }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        // // Channel specific checking
        // if (command.channelSpecific && !(interaction.channel.id === command.channelSpecific)) {
        //     return interaction.reply({ content: `Sorry, this command can only be ran in ${interaction.guild.channels.cache.get(command.channelSpecific)}`, ephemeral: true });
        // }

        // // Event role specific checking
        // if (command.roleSpecific && !interaction.member.roles.cache.has(command.roleSpecific)) {

        //     return interaction.reply({ content: `Sorry, only members with the \`${interaction.guild.roles.cache.get(command.roleSpecific).name}\` role can use this command.`, ephemeral: true });
        // }

        // Channel specific checking
        if (command.channelSpecific && !(interaction.channel.id === config[interaction.guild.id].discord[command.channelSpecific])) {
            let message = `Sorry, this command can only be ran in ${interaction.guild.channels.cache.get(config[interaction.guild.id].discord[command.channelSpecific])}`;

            const guildChannels = interaction.guild.channels.cache;
            if (!guildChannels.has(config[interaction.guild.id].discord[command.channelSpecific])) {
                // If the channel specific id does not exist in the guild, let them know.
                message += ` . You are seeing \`undefined\` because this command can only be used in a channel with the id \`${config[interaction.guild.id].discord[command.channelSpecific]}\`, which does not exist in this server. Fix this by having staff or the server owner update the value for \`${command.channelSpecific}\` by using the \`/config update discord\` command.`;
            }

            return interaction.reply({ content: message, ephemeral: true });
        }

        // Event role specific checking
        if (command.roleSpecific && !interaction.member.roles.cache.has(config[interaction.guild.id].discord[command.roleSpecific])) {
            let message = `Sorry, only members with the \`${interaction.guild.roles.cache.get(config[interaction.guild.id].discord[command.roleSpecific]).name}\` role can use this command.`

            const guildRoles = interaction.guild.roles.cache;
            if (!guildRoles.has(config[interaction.guild.id].discord[command.roleSpecific])) {
                // If the role specific id does not exist in the guild, let them know.
                message += ` . You are seeing \`undefined\` because this command can only be used by members with the role id \`${config[interaction.guild.id].discord[command.roleSpecific]}\`, which does not exist on any roles in this server. Fix this by having staff or the server owner update the value for \`${command.roleSpecific}\` by using the \`/config update discord\` command.`;
            }

            return interaction.reply({ content: message, ephemeral: true });
        }

        // Run the command
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}`);
            console.error(error);
        }
    },
};