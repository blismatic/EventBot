const fs = require('node:fs');
const { Events } = require('discord.js');
const config = require('../config.json');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../credentials.json');
const mysql = require('mysql2/promise');

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        console.log(`Just left / was kicked from the server ${guild.id}`);
        const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });

        // Remove guild id row from each of the config tables.
        const config_table_names = ['discord', 'event', 'recap', 'teams'];
        for (let name of config_table_names) {
            try {
                await con.execute(`DELETE FROM config_${name} WHERE guild_id = ?;`, [guild.id]);
                // console.log(`Successfully removed ${guild.id} from config_${name}`);
            } catch (error) {
                console.error('Error executing query:', error);
            }
        }

        // Remove guild data from users and items table, if it exists.
        try {
            await con.execute(`DELETE FROM users WHERE guild_id = ?;`, [guild.id]);
            // console.log(`Successfully removed all ${guild.id} rows from users table`);

            await con.execute(`DELETE FROM items WHERE guild_id = ?;`, [guild.id]);
            // console.log(`Successfully removed all ${guild.id} rows from items table`);
        } catch (error) {
            console.error('Error executing query:'.error);
        }

        await con.end();
        console.log('Connection closed successfully.');
    }
}