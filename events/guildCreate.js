const fs = require('node:fs');
const { Events } = require('discord.js');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../credentials.json');
const mysql = require('mysql2/promise');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        console.log(`Just joined the server ${guild.id}`);
        const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });

        // Initalize the guild_id for each of the config tables.
        const config_table_names = ['discord', 'event', 'recap', 'teams'];
        for (let name of config_table_names) {
            try {
                await con.execute(`INSERT INTO config_${name} (guild_id) values (?);`, [guild.id]);
                // console.log(`Successfully initialized config_${name} for ${guild.id}`);
            } catch (error) {
                console.error('Error executing query:', error);
            }
        }

        await con.end();
        console.log('Connection closed successfully.');
    },
};