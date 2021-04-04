const Discord = require('discord.js');
const mysql = require('mysql2');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require ('../config.json');

module.exports = {
    name: 'lock-in-participants',
    description: 'Takes all the !register messages and inserts player data to the database. This includes:\ndiscord ID\nrsn\nassigned team\ncurrent osrs stats / kc.',
    aliases: ['lock'],
    guildOnly: true,
    args: true,
    usage: '<channel_name>',
    cooldown: 3,
    async execute(message, args) {
        let channelName = args[0];
        //message.channel.messages.fetch()

        const connection = mysql.createConnection({
            host: mysql_host,
            user: mysql_user,
            database: mysql_database,
            password: mysql_password
        });

        connection.query(`INSERT INTO users (discord_id, rsn, team) values (${message.author.id}, ${rsn}, $)`);
    },
}