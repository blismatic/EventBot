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
                                .setMaxValue(10)
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
        // let allSettings = JSON.parse(fs.readFileSync('config.json'));
        // let settings = allSettings[interaction.guild.id];
        let guildConfig = config[interaction.guild.id];
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'view') {
            const section = interaction.options.getString('section');

            const embed = new EmbedBuilder()
                .setTitle(`Current ${section} settings`)
            if (section === 'teams') {
                let counter = 1;
                for (const team of guildConfig[section]) {
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
                Object.entries(guildConfig[section]).forEach(([key, value]) => {
                    valueString += `*${key}* = \`${value}\`\n`;
                });

                embed.addFields({ name: section, value: valueString });
            }
            return interaction.reply({ embeds: [embed] });
        }


        if (subcommandGroup === 'update') {
            // Dealing with new guilds, where the eventStaffRole_id might not exist yet. These checks are necessary because the /config command as a whole does not have a roleSpecific attribute.
            if (interaction.user.id === interaction.guild.ownerId) {
                // If the person sending the command is the owner of the server, let it go through.
                // If the event staff role doesn't exist though, warn them that they are the only one who can run staff specific commands.
                const guildRoleIds = interaction.guild.roles.cache;
                if (!guildRoleIds.has(guildConfig.discord.eventStaffRole_id)) {
                    await interaction.channel.send({ content: `**WARNING:** You have not yet set a valid event staff role through the \`/config update discord setting: eventStaffRole_id value: <Role ID>\` command, meaning you (as the guild owner) are the only one currently who can use staff specific commands, such as /config update or /assign` });
                }
            } else {
                // If the person sending the command is not the server owner, check if the eventStaffRole_id exists.
                const guildRoleIds = interaction.guild.roles.cache;
                if (guildRoleIds.has(guildConfig.discord.eventStaffRole_id)) {
                    // If it does exist, check if the sender of the command has the role.
                    const senderRoleIds = interaction.member.roles.cache;
                    if (!senderRoleIds.has(guildConfig.discord.eventStaffRole_id)) {
                        // If they don't have the role, let them know they can't use this.
                        return interaction.reply({ content: `Sorry, only members with the \`${guildRoleIds.get(guildConfig.discord.eventStaffRole_id).name}\` role can use this command.`, ephemeral: true });
                    }

                } else {
                    // If it does not exist, return a message that says the role doesn't exist yet, and must be set by the owner.
                    return interaction.reply({ content: `No event staff role was found. Please have the guild owner use the \`/config update discord setting: eventStaffRole_id value: <Role ID>\` command to designate a certain role as staff for this event.` })
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(`${subcommand}`);

            // Creating the "adjusted" embeds
            if (subcommand === 'event') {
                const setting = interaction.options.getString('setting');
                const value = interaction.options.getNumber('value');
                let valueString = `${setting}: \`${guildConfig[subcommand][setting]}\` -> \`${value}\``;
                embed.addFields({ name: 'Adjusted value', value: valueString });
                guildConfig[subcommand][setting] = value;

            } else if (subcommand === 'teams') {
                const teamIndex = interaction.options.getInteger('team') - 1;
                const setting = interaction.options.getString('setting');
                const value = interaction.options.getString('value');

                if (setting === 'name') {
                    const currentTeamNames = guildConfig.teams.map(team => team.name);
                    if (currentTeamNames.includes(value)) {
                        return interaction.reply({ content: `Error: \`${value}\` is already a team name. Current team names are \`${currentTeamNames}\``, ephemeral: true });
                    }
                    const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });
                    await con.execute(`UPDATE users_${interaction.guild.id} 
                    SET team = ? WHERE team = ?`, [value, guildConfig[subcommand][teamIndex]['name']]);

                }

                let valueString = `${setting}: \`${guildConfig[subcommand][teamIndex][setting]}\` -> \`${value}\``
                embed.addFields({ name: 'Adjusted value', value: valueString });
                guildConfig[subcommand][teamIndex][setting] = value;

            } else if (subcommand === 'discord') {
                const setting = interaction.options.getString('setting');
                const value = interaction.options.getString('value');
                let valueString = `${setting}: \`${guildConfig[subcommand][setting]}\` -> \`${value}\``;
                embed.addFields({ name: 'Adjusted value', value: valueString });
                guildConfig[subcommand][setting] = value;

            } else if (subcommand === 'recap') {
                const setting = interaction.options.getString('setting');
                const value = interaction.options.getString('value');
                let valueString = `${setting}: \`${guildConfig[subcommand][setting]}\` -> \`${value}\``;
                embed.addFields({ name: 'Adjusted value', value: valueString });
                guildConfig[subcommand][setting] = value;

            } else {
                console.log('This should not ever appear.');
            }

            // Update the local config.json file with these adjusted values.
            // allSettings[interaction.guild.id] = settings;
            fs.writeFileSync('config.json', JSON.stringify(config, null, 2));

            // Creating the "summary" embeds
            let valueString = '';
            if (subcommand === 'teams') {
                let counter = 1;
                for (const team of guildConfig[subcommand]) {
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
                Object.entries(guildConfig[subcommand]).forEach(([key, value]) => {
                    valueString += `*${key}* = \`${value}\`\n`;
                });
                embed.addFields({ name: `New ${subcommand} settings`, value: valueString });
            }
            return interaction.reply({ embeds: [embed] });
        }
    },
};