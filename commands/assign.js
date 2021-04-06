const mysql = require('mysql2');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../config.json');

var con = mysql.createConnection({
    host: mysql_host,
    user: mysql_user,
    password: mysql_password,
    database: mysql_database
});

module.exports = {
    name: 'assign',
    description: 'Assigns a user to an event team.',
    aliases: [''],
    guildOnly: true,
    args: true,
    usage: '<user> <team name>',
    cooldown: 3,
    execute(message, args) {
        const taggedUser = message.mentions.users.first();
        // Only allow users with the 'Event Staff' role to run this command
        if (message.member.roles.cache.some(role => role.name === 'Event Staff')) {

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
                    // Make sure that the second argument is one of the five possible team names.
                    if ((args[1] == 'Armadyl') || (args[1] == 'Bandos') || (args[1] == 'Guthix') || (args[1] == 'Saradomin') || (args[1] == 'Zamorak')) {
                        con.query(`UPDATE users SET team = ? WHERE discord_id = ?`, [args[1], taggedUser.id], (err, result, fields) => {
                            if (err) throw err;
                        });
                        message.react('✅');

                        // If the second argument was not one of the five possible team names, let the sender know.
                    } else {
                        return message.reply('something went wrong. The only valid team names for assignment are \`Armadyl\` \`Bandos\` \`Guthix\` \`Saradomin\` and \`Zamorak\`');
                    }
                }
            }

            // If the sender of the message does not have the 'Event Staff' role, tell them they do not have correct permissions.
        } else {
            return message.reply('sorry, you do not have the correct permissions to use this command.');
        }
    },
}