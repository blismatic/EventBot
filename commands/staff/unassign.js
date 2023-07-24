const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../../credentials.json');
const mysql = require('mysql2/promise');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unassign')
        .setDescription('Removes a player from their current team, if any.')
        .addUserOption(option => option.setName('target').setDescription('The user to unassign.').setRequired(true))
        .addBooleanOption(option => option.setName('removestats').setDescription('Remove the players points and submissions as well?')),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const removeStats = interaction.options.getBoolean('removestats');

        // Check if the target player is even registered.
        const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });
        const [rows, fields] = await con.execute(`SELECT discord_id, team FROM users WHERE discord_id = ? AND guild_id = ?;`, [target.id, interaction.guild.id]);

        if (rows.length === 0) {
            return interaction.reply({ content: `User ${target} was not found in the event. Are you sure they have registered?`, ephemeral: true });
        }

        // Check if the target player is even currently on a team.
        if (rows[0].team === null) {
            return interaction.reply({ content: `User ${target} is not currently on a team.`, ephemeral: true });
        }

        // If the sender chose to removestats, make them confirm they understand the consequences.
        if (removeStats) {
            const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Confirm').setStyle(ButtonStyle.Success);
            const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary);
            const row = new ActionRowBuilder().addComponents(cancel, confirm);

            const response = await interaction.reply({
                content: `You included the \`removestats\` flag, meaning you also want to completely erase ${target}'s points and submissions from this event. Are you sure you want to do this? **There is no going back.**`,
                components: [row],
                allowedMentions: { users: [] }
            });
            const collectorFilter = i => i.user.id === interaction.user.id;
            try {
                const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
                if (confirmation.customId === 'cancel') {
                    return confirmation.update({ content: `This action has been cancelled.`, components: [] });
                } else if (confirmation.customId === 'confirm') {
                    await con.execute(`DELETE FROM users WHERE discord_id = ? AND guild_id = ?;`, [target.id, interaction.guild.id]);
                    await con.execute(`DELETE FROM items WHERE discord_id = ? AND guild_id = ?;`, [target.id, interaction.guild.id]);
                    await con.end();
                    return confirmation.update({ content: `${target} successfully removed from team \`${rows[0].team}\` alongisde all of their points and submissions.`, allowedMentions: { users: [] }, components: [] });
                }
            } catch (e) {
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            }
        }

        // If the sender did not include the removestats flag, just remove the target from their team.
        await con.execute(`UPDATE users SET team = ? WHERE discord_id = ? AND guild_id = ?;`, [null, target.id, interaction.guild.id]);
        await con.end();
        return interaction.reply({ content: `${target} successfully removed from team \`${rows[0].team}\`.`, allowedMentions: { users: [] } });
    }
}