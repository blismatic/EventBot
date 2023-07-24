const fs = require('node:fs');
const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../../credentials.json');
const con = mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });

module.exports = {
    // channelSpecific: "sign_upsChannel_id",
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
        if (!isValidRSN(rsn)) {
            return interaction.reply({ content: `Please provide a valid username. If you believe there isn't anything wrong with \`${rsn}\`, please contact an Event Staff member`, ephemeral: true });
        }

        const sender = interaction.user;
        // Search for the sender in the database.
        con.execute(`SELECT discord_id, rsn FROM users WHERE discord_id = ?;`, [sender.id], async function (err, result, fields) {
            if (err) throw err;

            // If they are not there, add them to the database.
            if (result.length === 0) {
                con.execute(`INSERT INTO users (discord_id, discord_username, rsn) values (?, ?, ?);`, [sender.id, sender.username, rsn], async function (err, result, fields) {
                    if (err) throw err;
                    await interaction.reply({ content: `Thank you. Your rsn for this event has been set to \`${rsn}\`` });
                });

            } else {
                // Otherwise, let them know that they already have a rsn registered, and ask to confirm they would like to change it.
                const previousRsn = result[0].rsn;

                const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Confirm').setStyle(ButtonStyle.Success);
                const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary);
                const row = new ActionRowBuilder().addComponents(cancel, confirm);

                // Show them 2 button components, one to confirm they want to update, and one to cancel.
                const response = await interaction.reply({
                    content: `You already have the rsn \`${previousRsn}\` registered for this event. Are you sure that you want to replace this with \`${rsn}\`?`,
                    components: [row]
                });
                const collectorFilter = i => i.user.id === interaction.user.id;

                try {
                    const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

                    if (confirmation.customId === 'confirm') {
                        // If they clicked the confirm button, update their rsn.
                        con.execute(`UPDATE users SET rsn = ? WHERE discord_id = ?;`, [rsn, sender.id], (err, result, fields) => {
                            if (err) throw err;
                        });
                        await confirmation.update({ content: `Your registered rsn has been updated to \`${rsn}\`.`, components: [] });

                    } else if (confirmation.customId === 'cancel') {
                        // If they cancelled, just reply to them that it has been cancelled.
                        await confirmation.update({ content: `This action has been cancelled.`, components: [] });
                    }
                } catch (e) {
                    // If they don't click on either of the buttons after 1 minute, cancel the whole thing.
                    await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
                }
            }
        });
    },
};

function isValidRSN(x) {
    if (x.match(/(?!Java|Mod|Jagex)^[a-z0-9]{1}(?!  )[\w- ]{0,10}[a-z0-9]{0,1}$/gi) != null) {
        return true;
    }
    return false;
}