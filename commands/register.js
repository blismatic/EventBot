const mysql = require('mysql2');
const { mysql_host, mysql_user, mysql_password, mysql_database, sign_upsChannel_id } = require('../config.json');

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
        // Make sure that the command is being sent within the 'sign-ups' channel
        if (message.channel.id === sign_upsChannel_id) {

            const sender = message.author;
            // Search for the sender in the database.
            con.query(`SELECT discord_id FROM users WHERE discord_id = ?;`, [sender.id], (err, result, fields) => {
                if (err) throw err;

                // If they are not there, add them to the database.
                if (result.length === 0) {
                    con.query(`INSERT INTO users (discord_id, discord_tag) values (?, ?);`, [sender.id, sender.tag], (err, result, fields) => {
                        if (err) throw err;
                    });
                }

                // Once their discord id is in the database, update their 'rsn' field with the arugment they provided, as long as it is valid.
                if (isValidRSN(args.join(" "))) {
                    con.query(`UPDATE users SET rsn = ? WHERE discord_id = ?;`, [args.join(" "), sender.id], (err, result, fields) => {
                        if (err) throw err;
                        // If their rsn was set successfully, let them know by reacting with a checkmark.
                        return message.react('✅');
                    });

                    // If something went wrong, let them know why.
                } else {
                    message.react('❌');
                    return message.reply(`try again with a valid rsn.`);
                }
            });
        } else {
            // If the message was not sent in the 'sign-ups' channel, let them know.
            return message.reply('sorry, this command can only be used in the sign-ups channel');
        }
    },
}

// Checks a string to see if it does not contain the phrase Java, Mod, or Jagex
//                              does not start or end with a space or hypher or underscore
//                              does not contain consecutive spaces
function isValidRSN(x) {
    if (x.match(/(?!Java|Mod|Jagex)^[a-z0-9]{1}(?!  )[\w- ]{0,10}[a-z0-9]{0,1}$/gi) != null) {
        return true;
    }
    return false;
}
