const fs = require('node:fs');
const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../../config.json');
// const mysql = require('mysql2');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../../credentials.json');
const mysql = require('mysql2/promise');

module.exports = {
    channelSpecific: config.discord.sign_upsChannel_id,
    roleSpecific: config.discord.eventStaffRole_id,
    data: new SlashCommandBuilder()
        .setName('assign')
        .setDescription('Assigns a registered user to a team. To see possible team names, run \`/config view teams\`')
        .addUserOption(option => option.setName('target').setDescription('The user to assign a team.').setRequired(true))
        .addStringOption(option => option.setName('team').setDescription('The name of the team.').setRequired(true)),
    async execute(interaction) {
        const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });
        const target = interaction.options.getUser('target');
        const team = interaction.options.getString('team');

        // Check if the target has registered for the event.
        let [rows, fields] = await con.execute(`SELECT discord_id, team FROM users WHERE discord_id = ?;`, [target.id]);
        if (rows.length === 0) {
            // If they have not registered, let the author know and stop running.
            return interaction.reply({ content: `something went wrong. ${target} has not yet registered for the event.`, ephemeral: true });
        }

        // If the provided team name is not part of the valid team names, let the author know what the valid team names are, and stop running.
        const validTeamNames = config.teams.map(team => team.name);
        if (!validTeamNames.includes(team)) {
            return interaction.reply({ content: `\`${team}\` is not a valid team name. Valid names are \`${validTeamNames}\``, ephemeral: true });
        }

        // If the target is already on a team, make the sender confirm to switch them.
        if (!(rows[0].team === null)) {
            const previousTeam = rows[0].team;

            const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Confirm').setStyle(ButtonStyle.Success);
            const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary);
            const row = new ActionRowBuilder().addComponents(cancel, confirm);

            // Show them 2 button components, one to confirm they want to update, and one to cancel.
            const response = await interaction.reply({
                content: `${target} is already assigned to the \`${previousTeam}\` team. Are you sure that you want to move them to \`${team}\`?`,
                components: [row],
                allowedMentions: { users: [] }
            });
            const collectorFilter = i => i.user.id === interaction.user.id;

            try {
                const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
                if (confirmation.customId === 'cancel') {
                    // If they clicked the cancel button, stop execution.
                    return confirmation.update({ content: `This action has been cancelled.`, components: [] });
                } else if (confirmation.customId === 'confirm') {
                    await con.execute(`UPDATE users SET team = ? WHERE discord_id = ?;`, [team, target.id]);
                    return confirmation.update({ content: `${target} successfully added to team \`${team}\`.`, allowedMentions: { users: [] }, components: [] });
                }
            } catch (e) {
                // If they don't click on either of the buttons after 1 minute, cancel the whole thing.
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            }
        }

        // Send an SQL query to assign the specified team to the target discord id
        await con.execute(`UPDATE users SET team = ? WHERE discord_id = ?;`, [team, target.id]);
        return interaction.reply({ content: `${target} successfully added to team \`${team}\`.`, allowedMentions: { users: [] } });
        // return confirmation.update({ content: `${target} successfully added to team \`${team}\`.`, allowedMentions: { users: [] }, components: [] });
    },
};