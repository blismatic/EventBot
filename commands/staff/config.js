const fs = require('node:fs');
const { SlashCommandBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('View / update the bot configuration.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View a section of the config.')
                .addStringOption(option =>
                    option.setName('section')
                        .setDescription('The name of the section you want to view.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'event', value: 'event' },
                            { name: 'teams', value: 'teams' },
                            { name: 'discord', value: 'discord' },
                            { name: 'recap', value: 'recap' }
                        )
                )
        )
        .addSubcommandGroup(group =>
            group
                .setName('update')
                .setDescription('Update a section of the config.')
                .addSubcommand(subcommand =>
                    subcommand.setName('event')
                        .setDescription('Update the event config.')
                        .addStringOption(option =>
                            option.setName('setting')
                                .setDescription('The name of the setting you want to update.')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'basePoints', value: 'basePoints' },
                                    { name: 'repeatPointsModifier', value: 'repeatPointsModifier' },
                                    { name: 'timeBetweenTasks', value: 'timeBetweenTasks' },
                                    { name: 'timeBetweenThumbnailSwap', value: 'timeBetweenThumbnailSwap' },
                                )
                        )
                        .addNumberOption(option =>
                            option.setName('value')
                                .setDescription('The new value for this setting.')
                                .setRequired(true)
                        )
                )
        ),
    async execute(interaction) {
        let settings = JSON.parse(fs.readFileSync('config.json'));
        const subcommandGroup = interaction.options.getSubcommandGroup(); // Either 'view' or 'update'
        const subcommand = interaction.options.getSubcommand();

        // console.log(settings[subcommand]);

        if (subcommandGroup === 'view') {
            const embed = new EmbedBuilder()
                .setTitle(`Current ${subcommand} Settings`)
                .setDescription('Here are the current settings:')
                .addFields({ name: 'All Settings', value: JSON.stringify(settings[subcommand], null, 2) });
            await interaction.reply({ embeds: [embed] })
        } else if (subcommandGroup === 'update') {
            const setting = interaction.options.getString('setting');
            const value = interaction.options.getString('value');

            await interaction.reply({ content: `You gave a setting of \`${setting}\` and a value of \`${value}\`` });
        }
    },
};