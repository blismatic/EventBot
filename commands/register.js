const mysql = require('mysql2');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../config.json');

var con = mysql.createConnection({
    host: mysql_host,
    user: mysql_user,
    password: mysql_password,
    database: mysql_database
});

module.exports = {
    name: 'register',
    description: 'Registers your discord_id and rsn for the event.',
    aliases: [''],
    guildOnly: true,
    args: true,
    usage: '<rsn>',
    cooldown: 3,
    execute(message, args) {
        const sender = message.author;
        // Search for the sender in the database.
        con.query(`SELECT discord_id FROM users WHERE discord_id = ?;`, [sender.id], (err, result, fields) => {
            if (err) throw err;

            // If they are not there, add them to the database.
            if (result.length === 0) {
                con.query(`INSERT INTO users (discord_id) values (?);`, [sender.id], (err, result, fields) => {
                    if (err) throw err;
                });
            }

            // Once their discord id is in the database, update their 'rsn' field with the arugment they provided.
            if (args.join(" ").length <= 20) {
                con.query(`UPDATE users SET rsn = ? WHERE discord_id = ?;`, [args.join(" "), sender.id], (err, result, fields) => {
                    if (err) throw err;
                    // If their rsn was set successfully, let them know by reacting with a checkmark.
                    message.react('✅');
                });

            // If something went wrong, let them know why.
            } else {
                return message.reply(`your rsn must be 20 characters or less.`);
            }
        });
    },
}