const mysql = require('mysql2');
const config = require('../../../config.json');
const { updateRanks, con } = require('../../index.js');
// let con = require('../../index.js');
// var con = mysql.createConnection({
//     host: config.mysql_host,
//     user: config.mysql_user,
//     password: config.mysql_password,
//     database: config.mysql_database
// });

module.exports = {
    name: 'register',
    description: 'Registers your discord_id and rsn for the event.',
    aliases: [''],
    guildOnly: true,
    args: true,
    usage: '<rsn>',
    cooldown: 3,
    channelSpecific: true,
    channelID: config.sign_upsChannel_id,
    execute(message, args) {
        const sender = message.author;
        // Search for the sender in the database.
        con.execute(`SELECT discord_id FROM users WHERE discord_id = ?;`, [sender.id], (err, result, fields) => {
            if (err) throw err;

            // If they are not there, add them to the database.
            if (result.length === 0) {
                con.execute(`INSERT INTO users (discord_id) values (?);`, [sender.id], (err, result, fields) => {
                    if (err) throw err;
                    updateRanks();
                });
            }

            // Once their discord id is in the database, update their 'rsn' field with the arugment they provided, as long as it is valid.
            if (isValidRSN(args.join(" "))) {
                con.execute(`UPDATE users SET rsn = ? WHERE discord_id = ?;`, [args.join(" "), sender.id], (err, result, fields) => {
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
