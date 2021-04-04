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
        con.query(`SELECT discord_id FROM users WHERE discord_id = ?`, [sender.id], (err, result, fields) => {
            if (err) throw err;

            // If they are not there, add them to the database.
            if (result.length === 0) {
                con.query(`INSERT INTO users (discord_id) value (?)`, [sender.id], (err, result, fields) => {
                    if (err) throw err;
                });
            }
        });

        // Once we know the sender is in the database, update their "rsn" cell with the first argument they submitted in their message.
        if (args.join(" ").length <= 20) {
            con.query(`UPDATE users SET rsn = ? WHERE discord_id = ?`, [args.join(" "), sender.id], (err, result, fields) => {
                if (err) throw err;
                // If their rsn was set successfully, let them know.
                return message.reply(`your rsn was updated to **${args.join(" ")}**`);
            });
        } else {
            // If their rsn was not set, let them know why.
            return message.reply(`your rsn must be 20 characters or less.`);
        }
    },
}