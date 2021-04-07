const mysql = require('mysql2');
const { mysql_host, mysql_user, mysql_password, mysql_database, resultsChannel_id, armadyl_logo, armadyl_color, bandos_logo, bandos_color, guthix_logo, guthix_color, saradomin_logo, saradomin_color, zamorak_logo, zamorak_color } = require('../config.json');
const Discord = require('discord.js');

var con = mysql.createConnection({
    host: mysql_host,
    user: mysql_user,
    password: mysql_password,
    database: mysql_database
});

// Armadyl, Bandos, Guthix, Saradomin, Zamorak

module.exports = {
    name: 'leaderboard',
    description: 'Shows the current results of the event. Valid team names are \`overall, all\` \`Armadyl, Arma\` \`Bandos\` \`Guthix\` \`Saradomin, Sara\` \`Zamorak, Zammy\`',
    aliases: ['lb'],
    guildOnly: true,
    args: true,
    usage: '<team>',
    cooldown: 3,
    execute(message, args) {
        // Make sure that the command is being sent within the 'results' channel
        if (message.channel.id === resultsChannel_id) {
            // create the base message embed
            const leaderboardEmbed = new Discord.MessageEmbed().setTitle('Event Leaderboards').setTimestamp();

            // User searching for entire leaderboards
            if ((args[0].toLowerCase() == 'overall') || (args[0].toLowerCase() == 'all')) {
                // create the base message embed
                const leaderboardEmbed = new Discord.MessageEmbed().setTitle('Event Leaderboards').setTimestamp();

                con.query(`SELECT team, SUM(points) as 'total' FROM users GROUP BY team ORDER BY SUM(points) DESC;`, (err, result, fields) => {
                    if (err) throw err;

                    // Make a string containing all of the teams and their overall points
                    // and add it to the embedded message.
                    let tempString = '';
                    for (let i = 0; i < result.length; i++) {
                        tempString += `${i + 1}. ${result[i].team} - ${numberWithCommas(parseInt(result[i].total))} points\n\n`;
                    }
                    leaderboardEmbed.addField(`All team standings`, `${tempString}`);

                    // Add the logo and color of the team who is in first place to the embedded message.
                    if (result[0].team == 'Armadyl') {
                        leaderboardEmbed.setThumbnail(armadyl_logo);
                        leaderboardEmbed.setColor(armadyl_color);
                    } else if (result[0].team == 'Bandos') {
                        leaderboardEmbed.setThumbnail(bandos_logo);
                        leaderboardEmbed.setColor(bandos_color);
                    } else if (result[0].team == 'Guthix') {
                        leaderboardEmbed.setThumbnail(guthix_logo);
                        leaderboardEmbed.setColor(guthix_color);
                    } else if (result[0].team == 'Saradomin') {
                        leaderboardEmbed.setThumbnail(saradomin_logo);
                        leaderboardEmbed.setColor(saradomin_color);
                    } else if (result[0].team == 'Zamorak') {
                        leaderboardEmbed.setThumbnail(zamorak_logo);
                        leaderboardEmbed.setColor(zamorak_color);
                    }

                    message.channel.send(leaderboardEmbed);
                });

                // User searching for Armadyl leaderboards
            } else if ((args[0].toLowerCase() == 'armadyl') || (args[0].toLowerCase() == 'arma')) {
                sendLeaderboardMessage('Armadyl');

                // User searching for Bandos leaderboards
            } else if ((args[0].toLowerCase() == 'bandos')) {
                sendLeaderboardMessage('Bandos');

                // User searching for Guthix leaderboards
            } else if ((args[0].toLowerCase() == 'guthix')) {
                sendLeaderboardMessage('Guthix');

                // User searching for Saradomin leaderboards
            } else if ((args[0].toLowerCase() == 'saradomin') || (args[0].toLowerCase() == 'sara')) {
                sendLeaderboardMessage('Saradomin');

                // User searching for Zamorak leaderboards
            } else if ((args[0].toLowerCase() == 'zamorak') || (args[0].toLowerCase() == 'zammy')) {
                sendLeaderboardMessage('Zamorak');

                // Finally, if the provided argument did not match any of the team names
            } else {
                return message.reply('something went wrong. Are you typing a valid team name?');
            }

            // If the command was not run in the 'results' channel, let them know
        } else {
            return message.reply('this command can only be used in the results channel.');
        }

        function sendLeaderboardMessage(submittedName) {
            // create the base message embed
            const leaderboardEmbed = new Discord.MessageEmbed().setTitle('Event Leaderboards').setTimestamp();

            con.query(`SELECT rsn, points, summed.totalPoints, discord_tag FROM users 
                JOIN (SELECT team, sum(points) as 'totalPoints' FROM users GROUP BY team) 
                AS summed ON summed.team = users.team WHERE users.team = '${submittedName}' ORDER BY points DESC;`, (err, result, fields) => {
                if (err) throw err;

                // Check if the submitted team name has any members assigned to it.
                if (!result || !result.length) {
                    return message.reply('that team does not have any members yet.');
                }

                // Make another query to find out what placement the searched for team is at.
                con.query(`SELECT team, SUM(points) as 'total' FROM users GROUP BY team ORDER BY SUM(points) DESC;`, (err2, result2, fields2) => {
                    if (err2) throw err2;

                    // Get the placement of the team and save it as a number
                    let placement = -1;
                    for (let i = 0; i < result2.length; i++) {
                        if (result2[i].team == submittedName) {
                            placement = i + 1;
                        }
                    }

                    // Using the placement of the team as a number, get the placement text.
                    let placementText = '';
                    if (placement == 1) {
                        placementText = '1st place';
                    } else if (placement == 2) {
                        placementText = '2nd place';
                    } else if (placement == 3) {
                        placementText = '3rd place';
                    } else if (placement == 4 || placement == 5) {
                        placementText = `${placement}th place`;
                    }

                    // Add entire team's points and placement to the embedded message.
                    leaderboardEmbed.addField(`Team ${result2[placement - 1].team}`, `${numberWithCommas(parseInt(result[0].totalPoints))} points, ${placementText}`);

                    // Make a string containing all of the team members and their individual points
                    // and add it to the embedded message.
                    let tempString = '';
                    for (let i = 0; i < result.length; i++) {
                        tempString += `${i + 1}. ${result[i].rsn} (${result[i].discord_tag}) - ${numberWithCommas(parseInt(result[i].points))} points\n`;
                    }
                    leaderboardEmbed.addField(`Member standings`, `${tempString}`);

                    // Add the team's logo and team color to the embedded message.
                    if (submittedName == 'Armadyl') {
                        leaderboardEmbed.setThumbnail(armadyl_logo);
                        leaderboardEmbed.setColor(armadyl_color);
                    } else if (submittedName == 'Bandos') {
                        leaderboardEmbed.setThumbnail(bandos_logo);
                        leaderboardEmbed.setColor(bandos_color);
                    } else if (submittedName == 'Guthix') {
                        leaderboardEmbed.setThumbnail(guthix_logo);
                        leaderboardEmbed.setColor(guthix_color);
                    } else if (submittedName == 'Saradomin') {
                        leaderboardEmbed.setThumbnail(saradomin_logo);
                        leaderboardEmbed.setColor(saradomin_color);
                    } else if (submittedName == 'Zamorak') {
                        leaderboardEmbed.setThumbnail(zamorak_logo);
                        leaderboardEmbed.setColor(zamorak_color);
                    }

                    // Send the embedded message
                    message.channel.send(leaderboardEmbed);
                });
            });
        }

        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

    },
}