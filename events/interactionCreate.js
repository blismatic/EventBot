const { Collection, Events } = require('discord.js');

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

        // Channel specific checking
        if (command.channelSpecific && !(interaction.channel.id === command.channelSpecific)) {
            return interaction.reply({ content: `Sorry, this command can only be ran in ${interaction.guild.channels.cache.get(command.channelSpecific)}`, ephemeral: true });
        }

        // Event role specific checking
        if (command.roleSpecific && !interaction.member.roles.cache.has(command.roleSpecific)) {

            return interaction.reply({ content: `Sorry, only members with the \`${interaction.guild.roles.cache.get(command.roleSpecific).name}\` role can use this command.`, ephemeral: true });
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