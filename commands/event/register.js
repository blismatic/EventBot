const fs = require('node:fs');
const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config.json');
const mysql = require('mysql2');

module.exports = {
    channelSpecific: config.discord.sign_upsChannel_id,
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register your rsn with the event.')
        .addStringOption(option => option
            .setName('rsn')
            .setDescription('Your actual in game username.')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(12)
        ),
    async execute(interaction) {
        const rsn = interaction.options.getString('rsn');
        console.log(rsn);
        if (!isValidRSN(rsn)) {
            return interaction.reply({ content: `Please provide a valid username. If you believe there isn't anything wrong with \`${rsn}\`, please contact an Event Staff member`, ephemeral: true });
        }

        return interaction.reply(`This isn't done yet.`);
    },
};

function isValidRSN(x) {
    if (x.match(/(?!Java|Mod|Jagex)^[a-z0-9]{1}(?!  )[\w- ]{0,10}[a-z0-9]{0,1}$/gi) != null) {
        return true;
    }
    return false;
}