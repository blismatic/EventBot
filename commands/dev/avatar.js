const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    cooldown: 5,
    // channelSpecific: config.discord.submissionsChannel_id,
    // roleSpecific: config.discord.eventStaffRole_id,
    channelSpecific: "submissionsChannel_id",
    roleSpecific: "eventStaffRole_id",
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get the avatar URL of the selected user, or your own avatar.')
        .addUserOption(option => option.setName('target').setDescription('The user\'s avatar to show')),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        if (user) return interaction.reply(`${user.username}'s avatar: ${user.displayAvatarURL({ dynamic: true })}`);
        return interaction.reply(`Your avatar: ${interaction.user.displayAvatarURL()}`);
    },
};