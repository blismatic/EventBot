const Discord = require('discord.js');
const mysql = require('mysql2');
const config = require('../config.json');
const { updateRanks, con } = require('../index.js');

module.exports = {
    name: 'messageReactionRemove',
    eventStaffSpecific: true,
    channelSpecific: true,
    channelID: config.submissionsChannel_id,
    async execute(reaction, user) {
        const member = await reaction.message.guild.members.fetch(user);
        let memberHasRole = member.roles.cache.some(role => role.name === config.eventStaffRole);
        let resultsChannel = reaction.message.client.channels.cache.get(config.resultsChannel_id);

        // Only look for reactions removed by people with the Event Staff role.
        if (memberHasRole) {
            //console.log(`${user.username} has correct role? ${memberHasRole}`);

            // Only look for reactions removed within the 'submission' channel.
            if (reaction.message.channel.id === config.submissionsChannel_id) {
                //console.log(`messageReactionAdd detected in correct channel? ${reaction.message.channel.id === '827761465053413376'}`);
                // let resultsChannel = reaction.message.client.channels.cache.get('827762885902991452');

                // If the reaction removed is one of the ones we are looking for, do something.
                if (reaction.emoji.name == '\u0031\u20E3') {
                    removePoints(1);
                    updateRanks();
                }
                if (reaction.emoji.name == '\u0032\u20E3') {
                    removePoints(2);
                    updateRanks();
                }
                if (reaction.emoji.name == '\u0033\u20E3') {
                    removePoints(3);
                    updateRanks();
                }
                if (reaction.emoji.name == '\u0034\u20E3') {
                    removePoints(4);
                    updateRanks();
                }
                if (reaction.emoji.name == '\u0035\u20E3') {
                    removePoints(5);
                    updateRanks();
                }
                if (reaction.emoji.name == '\u2705') {
                    removePoints();
                    updateRanks();
                }
            }
        }

        function removePoints(emojiAdded = -1) {
            let newPoints = (5 - emojiAdded + 1) * parseInt(config.basePoints);
            if (emojiAdded == -1) {
                newPoints = Math.round(config.repeatPointsModifier * config.basePoints);
            }

            let team = '';
            let teamURL = '';
            con.execute(`SELECT team FROM users WHERE discord_id = ?`, [reaction.message.author.id], (err, result, fields) => {
                if (err) throw err;
                team = result[0].team;
            });

            con.query(`UPDATE users SET points = points-? WHERE discord_id = ?`, [newPoints, reaction.message.author.id], (err, result, fields) => {
                if (err) throw err;

                let submissionContent = reaction.message.content.slice(8);
                let reactee = reaction.message.author;

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
                    .setAuthor(`-${newPoints} points`, reactee.displayAvatarURL())
                    .setThumbnail(teamURL)
                    .setColor('#fa4327')
                    .setDescription(`Submission: [${submissionContent}](${reaction.message.url})
                Player: <@${reactee.id}>
                Staff: <@${user.id}>
                Team: ${team}`)
                    .setFooter('\u200b', 'https://oldschool.runescape.wiki/images/5/55/Ignore_button.png?33b0a')
                    .setTimestamp();

                resultsChannel.send(resultsEmbed);
            });
        }
    }
}