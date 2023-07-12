const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../../credentials.json');
const mysql = require('mysql2/promise');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View a team or user profile for this event.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('team')
                .setDescription('View a specific team profile.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name of the team to view')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('View a specific user profile.')
                .addUserOption(option =>
                    option.setName('name')
                        .setDescription('The name of the user to view')
                        .setRequired(true))
        ),
    async execute(interaction) {
        const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });
        console.log('I am here');
    },
};