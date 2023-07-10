const mysql = require('mysql2');
//const { mysql_host, mysql_user, mysql_password, mysql_database, eventStaffRole, sign_upsChannel_id } = require('../config.json');
const config = require('../../config.json');
const { con, updateRanks } = require('../../index.js');

// var con = mysql.createConnection({
//     host: config.mysql_host,
//     user: config.mysql_user,
//     password: config.mysql_password,
//     database: config.mysql_database
// });

module.exports = {
    name: 'assign',
    description: 'Assigns a user to an event team. Valid <team name>\'s are Armadyl, Bandos, Guthix, Saradomin, and Zamorak',
    aliases: [''],
    guildOnly: true,
    args: true,
    usage: '<user> <team name>',
    cooldown: 3,
    eventStaffSpecific: true,
    channelSpecific: true,
    channelID: config.sign_upsChannel_id,
    execute(message, args) {
        const taggedUser = message.mentions.users.first();

        // If there are no users mentioned, let the sender know they need to tag someone.
        if (!message.mentions.users.size) {
            return message.reply('you need to tag a user in order to assign them to a team.');

            // If there are more than one users mentioned, let the sender know they can only tag one person at a time.
        } else if (message.mentions.users.size > 1) {
            return message.reply('you can only assign one user at a time.');

            // If there is only one user tagged, continue.
        } else if (message.mentions.users.size == 1) {
            // If there are not exactly 2 arguments, let the sender know there should only be 2.
            if (args.length != 2) {
                return message.reply('something went wrong. There should only be two arguments to the !assign command, \`<user>\` and \`<team>\`');

                // If there is only one user tagged and exactly 2 arguments, continue.
            } else {
                con.execute(`SELECT discord_id FROM users WHERE discord_id = ?;`, [taggedUser.id], (err, result, fields) => {
                    if (err) throw err;
                    if (result.length === 0) {
                        message.react('❌');
                        return message.reply(`something went wrong. ${taggedUser} has not yet registered.`);
                    } else {
                        // Make sure that the second argument is one of the five possible team names.
                        if ((args[1] == 'Armadyl') || (args[1] == 'Bandos') || (args[1] == 'Guthix') || (args[1] == 'Saradomin') || (args[1] == 'Zamorak')) {
                            con.execute(`UPDATE users SET team = ? WHERE discord_id = ?`, [args[1], taggedUser.id], (err, result, fields) => {
                                if (err) throw err;
                            });
                            // message.react('✅');
                            con.execute(`UPDATE users SET placement = 0 WHERE discord_id = ?`, [taggedUser.id], (err, result, fields) => {
                                if (err) throw err;
                            });
                            updateRanks();
                            message.react('✅');

                            // If the second argument was not one of the five possible team names, let the sender know.
                        } else {
                            return message.reply('something went wrong. The only valid team names for assignment are \`Armadyl\` \`Bandos\` \`Guthix\` \`Saradomin\` and \`Zamorak\`');
                        }
                    }
                });
                // // Make sure that the second argument is one of the five possible team names.
                // if ((args[1] == 'Armadyl') || (args[1] == 'Bandos') || (args[1] == 'Guthix') || (args[1] == 'Saradomin') || (args[1] == 'Zamorak')) {
                //     con.execute(`UPDATE users SET team = ? WHERE discord_id = ?`, [args[1], taggedUser.id], (err, result, fields) => {
                //         if (err) throw err;
                //     });
                //     // message.react('✅');
                //     con.execute(`UPDATE users SET placement = 0 WHERE discord_id = ?`, [taggedUser.id], (err, result, fields) => {
                //         if (err) throw err;
                //     });
                //     updateRanks();
                //     message.react('✅');

                //     // If the second argument was not one of the five possible team names, let the sender know.
                // } else {
                //     return message.reply('something went wrong. The only valid team names for assignment are \`Armadyl\` \`Bandos\` \`Guthix\` \`Saradomin\` and \`Zamorak\`');
                // }
            }
        }
    },
}