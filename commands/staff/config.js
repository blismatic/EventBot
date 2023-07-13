const fs = require('node:fs');
const { SlashCommandBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const mysql = require('mysql2/promise');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../../credentials.json');

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
                .addSubcommand(subcommand =>
                    subcommand.setName('teams')
                        .setDescription('Update the teams config (excluding members).')
                        .addIntegerOption(option =>
                            option.setName('team')
                                .setDescription('The team number of the team you want to update.')
                                .setRequired(true)
                                .setMinValue(1)
                                .setMaxValue(6)
                        )
                        .addStringOption(option =>
                            option.setName('setting')
                                .setDescription('The name of the setting you want to update.')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'name', value: 'name' },
                                    { name: 'color', value: 'color' },
                                    { name: 'logo', value: 'logo' },
                                )
                        )
                        .addStringOption(option =>
                            option.setName('value')
                                .setDescription('The new value for this setting.')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand.setName('discord')
                        .setDescription('Update the discord config.')
                        .addStringOption(option =>
                            option.setName('setting')
                                .setDescription('The name of the setting you want to update.')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'eventStaffRole_id', value: 'eventStaffRole_id' },
                                    { name: 'eventDescriptionChannel_id', value: 'eventDescriptionChannel_id' },
                                    { name: 'sign_upsChannel_id', value: 'sign_upsChannel_id' },
                                    { name: 'tasksChannel_id', value: 'tasksChannel_id' },
                                    { name: 'resultsChannel_id', value: 'resultsChannel_id' },
                                    { name: 'submissionsChannel_id', value: 'submissionsChannel_id' },
                                )
                        )
                        .addStringOption(option =>
                            option.setName('value')
                                .setDescription('The new value for this setting.')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand.setName('recap')
                        .setDescription('Update the recap config.')
                        .addStringOption(option =>
                            option.setName('setting')
                                .setDescription('The name of the setting you want to update.')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'title', value: 'title' },
                                    { name: 'subtitle', value: 'subtitle' },
                                    { name: 'welcome_message', value: 'welcome_message' },
                                    { name: 'exit_message', value: 'exit_message' },
                                )
                        )
                        .addStringOption(option =>
                            option.setName('value')
                                .setDescription('The new value for this setting.')
                                .setRequired(true)
                        )
                )
        ),
    async execute(interaction) {
        let settings = JSON.parse(fs.readFileSync('config.json'));
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'view') {
            const section = interaction.options.getString('section');

            const embed = new EmbedBuilder()
                .setTitle(`Current ${section} settings`)
            if (section === 'teams') {
                let counter = 1;
                for (const team of settings[section]) {
                    let valueString = '';
                    for (const key in team) {
                        if (team.hasOwnProperty(key)) {
                            const value = team[key];
                            if (Array.isArray(value)) {
                                const membersString = value.map(member => `"${member}"`).join(', ');
                                valueString += `*${key}* = \`${membersString}\`\n`;
                            } else {
                                valueString += `*${key}* = \`${value}\`\n`;
                            }
                        }
                    }
                    embed.addFields({ name: `Team ${counter}`, value: valueString });
                    counter++;
                }
            } else {
                let valueString = '';
                Object.entries(settings[section]).forEach(([key, value]) => {
                    valueString += `*${key}* = \`${value}\`\n`;
                });

                embed.addFields({ name: section, value: valueString });
            }
            return interaction.reply({ embeds: [embed] });
        }


        if (subcommandGroup === 'update') {
            if (!interaction.member.roles.cache.has(config.discord.eventStaffRole_id)) {
                return interaction.reply({ content: `Sorry, only members with the \`${interaction.guild.roles.cache.get(config.discord.eventStaffRole_id).name}\` role can use this command.`, ephemeral: true });
            }
            const embed = new EmbedBuilder()
                .setTitle(`${subcommand}`);

            // Creating the "adjusted" embeds
            if (subcommand === 'event') {
                const setting = interaction.options.getString('setting');
                const value = interaction.options.getNumber('value');
                let valueString = `${setting}: \`${settings[subcommand][setting]}\` -> \`${value}\``;
                embed.addFields({ name: 'Adjusted value', value: valueString });
                settings[subcommand][setting] = value;

            } else if (subcommand === 'teams') {
                const teamIndex = interaction.options.getInteger('team') - 1;
                const setting = interaction.options.getString('setting');
                const value = interaction.options.getString('value');

                if (setting === 'name') {
                    const currentTeamNames = config.teams.map(team => team.name);
                    if (currentTeamNames.includes(value)) {
                        return interaction.reply({ content: `Error: \`${value}\` is already a team name. Current team names are \`${currentTeamNames}\``, ephemeral: true });
                    }
                    const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });
                    await con.execute(`UPDATE users SET team = ? WHERE team = ?`, [value, settings[subcommand][teamIndex]['name']]);

                }

                let valueString = `${setting}: \`${settings[subcommand][teamIndex][setting]}\` -> \`${value}\``
                embed.addFields({ name: 'Adjusted value', value: valueString });
                settings[subcommand][teamIndex][setting] = value;

            } else if (subcommand === 'discord') {
                const setting = interaction.options.getString('setting');
                const value = interaction.options.getString('value');
                let valueString = `${setting}: \`${settings[subcommand][setting]}\` -> \`${value}\``;
                embed.addFields({ name: 'Adjusted value', value: valueString });
                settings[subcommand][setting] = value;

            } else if (subcommand === 'recap') {
                const setting = interaction.options.getString('setting');
                const value = interaction.options.getString('value');
                let valueString = `${setting}: \`${settings[subcommand][setting]}\` -> \`${value}\``;
                embed.addFields({ name: 'Adjusted value', value: valueString });
                settings[subcommand][setting] = value;

            } else {
                console.log('This should not ever appear.');
            }

            fs.writeFileSync('config.json', JSON.stringify(settings, null, 2));

            // Creating the "summary" embeds
            let valueString = '';
            if (subcommand === 'teams') {
                let counter = 1;
                for (const team of settings[subcommand]) {
                    let valueString = '';
                    for (const key in team) {
                        if (team.hasOwnProperty(key)) {
                            const value = team[key];
                            if (Array.isArray(value)) {
                                const membersString = value.map(member => `"${member}"`).join(', ');
                                valueString += `*${key}* = \`${membersString}\`\n`;
                            } else {
                                valueString += `*${key}* = \`${value}\`\n`;
                            }
                        }
                    }
                    embed.addFields({ name: `Team ${counter}`, value: valueString });
                    counter++;
                }


            } else {
                Object.entries(settings[subcommand]).forEach(([key, value]) => {
                    valueString += `*${key}* = \`${value}\`\n`;
                });
                embed.addFields({ name: `New ${subcommand} settings`, value: valueString });
            }
            return interaction.reply({ embeds: [embed] });
        }
    },
};