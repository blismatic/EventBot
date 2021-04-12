const Discord = require('discord.js');
const mysql = require('mysql2');
const config = require('../config.json');
const { updateRanks, con } = require('../index.js');

// var con = mysql.createConnection({
//     host: config.mysql_host,
//     user: config.mysql_user,
//     password: config.mysql_password,
//     database: config.mysql_database
// });

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        const member = await reaction.message.guild.members.fetch(user);
        let memberHasRole = member.roles.cache.some(role => role.name === config.eventStaffRole);
        let resultsChannel = reaction.message.client.channels.cache.get(config.resultsChannel_id);

        // Only look for reactions added by people with the Event Staff role.
        if (memberHasRole) {

            // Only look for reactions added within the 'submissions' channel.
            if (reaction.message.channel.id === config.submissionsChannel_id) {

                // If the reaction is one of the three we are looking for, do something.
                if (reaction.emoji.name == '\u0031\u20E3') {
                    givePoints(1);
                    updateRanks();
                }
                if (reaction.emoji.name == '\u0032\u20E3') {
                    givePoints(2);
                    updateRanks();
                }
                if (reaction.emoji.name == '\u0033\u20E3') {
                    givePoints(3);
                    updateRanks();
                }
                if (reaction.emoji.name == '\u0034\u20E3') {
                    givePoints(4);
                    updateRanks();
                }
                if (reaction.emoji.name == '\u0035\u20E3') {
                    givePoints(5);
                    updateRanks();
                }
                if (reaction.emoji.name == '\u2705') {
                    givePoints();
                    updateRanks();
                }
            }
        }

        function givePoints(emojiAdded = -1) {
            let newPoints = (5 - emojiAdded + 1) * parseInt(config.basePoints);
            if (emojiAdded == -1) {
                newPoints = Math.round(parseFloat(config.repeatPointsModifier) * parseInt(config.basePoints))
            }

            let team = '';
            let teamURL = '';
            con.execute(`SELECT team FROM users WHERE discord_id = ?`, [reaction.message.author.id], (err, result, fields) => {
                if (err) throw err;
                team = result[0].team;
            });

            con.execute(`UPDATE users SET points = points+? WHERE discord_id = ?`, [newPoints, reaction.message.author.id], (err, result, fields) => {
                if (err) throw err;

                let submissionContent = reaction.message.content.slice(8);
                let reactee = reaction.message.author

                if (team == 'Armadyl') {
                    teamURL = config.armadyl_logo;
                } else if (team == 'Bandos') {
                    teamURL = config.bandos_logo;
                } else if (team == 'Guthix') {
                    teamURL = config.guthix_logo;
                } else if (team == 'Saradomin') {
                    teamURL = config.saradomin_logo;
                } else if (team == 'Zamorak') {
                    teamURL = config.zamorak_logo;
                }

                const resultsEmbed = new Discord.MessageEmbed()
                    .setAuthor(`+${newPoints} points`, reactee.displayAvatarURL())
                    .setThumbnail(teamURL)
                    .setColor('#ffc73a')
                    .setDescription(`Submission: [${submissionContent}](${reaction.message.url})
                Player: <@${reactee.id}>
                Staff: <@${user.id}>
                Team: ${team}`)
                    .setFooter('\u200b', 'https://oldschool.runescape.wiki/images/2/28/Friends_List.png?e4d52')
                    .setTimestamp();

                resultsChannel.send(resultsEmbed);
            });
        }
    },
};