const mysql = require('mysql2');
const { mysql_host, mysql_user, mysql_password, mysql_database, resultsChannel_id, bandos_logo } = require('../config.json');
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
                console.log('overall results');
                con.query(`SELECT team, SUM(points) as 'total' FROM users GROUP BY team ORDER BY SUM(points) DESC;`, (err, result, fields) => {
                    if (err) throw err;
                    console.log(result);
                    leaderboardEmbed.setDescription('All teams');
                    leaderboardEmbed.addField(`1st place: ${result[0].team}`, `${result[0].total} points`, true);
                    leaderboardEmbed.addField(`2nd place: ${result[1].team}`, `${result[1].total} points`, true);

                    message.channel.send(leaderboardEmbed);
                });

                // User searching for Armadyl leaderboards
            } else if ((args[0].toLowerCase() == 'armadyl') || (args[0].toLowerCase() == 'arma')) {
                console.log('team arma results');
                con.query(`SELECT rsn, points, summed.totalPoints FROM users 
            JOIN (SELECT team, sum(points) as 'totalPoints' FROM users GROUP BY team) 
            AS summed ON summed.team = users.team WHERE users.team = 'Armadyl';`, (err, result, fields) => {
                    if (err) throw err;
                    console.log(result);
                });

                // User searching for Bandos leaderboards
            } else if ((args[0].toLowerCase() == 'bandos')) {
                console.log('team bandos results');
                con.query(`SELECT rsn, points, summed.totalPoints FROM users 
                JOIN (SELECT team, sum(points) as 'totalPoints' FROM users GROUP BY team) 
                AS summed ON summed.team = users.team WHERE users.team = 'Bandos' ORDER BY points DESC;`, (err, result, fields) => {
                    if (err) throw err;
                    leaderboardEmbed.setThumbnail(bandos_logo);
                    // Add entire team's points to the embedded message.
                    leaderboardEmbed.addField(`Team Bandos`, `${result[0].totalPoints} points`);

                    // Make a string containing all of the team members and their individual points
                    // and add it to the embedded message.
                    let tempString = '';
                    for (let i = 0; i < result.length; i++) {
                        console.log(result[i]);
                        tempString += `${i+1}. ${result[i].rsn} - ${result[i].points} points\n`;
                    }
                    leaderboardEmbed.addField(`Member standings`, `${tempString}`);
                    
                    // Send the embedded message
                    message.channel.send(leaderboardEmbed);
                });

                // User searching for Guthix leaderboards
            } else if ((args[0].toLowerCase() == 'guthix')) {
                console.log('team guthix results');
                con.query(`SELECT rsn, points, summed.totalPoints FROM users 
            JOIN (SELECT team, sum(points) as 'totalPoints' FROM users GROUP BY team) 
            AS summed ON summed.team = users.team WHERE users.team = 'Guthix';`, (err, result, fields) => {
                    if (err) throw err;
                    console.log(result);
                });

                // User searching for Saradomin leaderboards
            } else if ((args[0].toLowerCase() == 'saradomin') || (args[0].toLowerCase() == 'sara')) {
                console.log('team sara results');
                con.query(`SELECT rsn, points, summed.totalPoints FROM users 
            JOIN (SELECT team, sum(points) as 'totalPoints' FROM users GROUP BY team) 
            AS summed ON summed.team = users.team WHERE users.team = 'Saradomin';`, (err, result, fields) => {
                    if (err) throw err;
                    console.log(result);
                });

                // User searching for Zamorak leaderboards
            } else if ((args[0].toLowerCase() == 'zamorak') || (args[0].toLowerCase() == 'zammy')) {
                console.log('team zammy results');
                con.query(`SELECT rsn, points, summed.totalPoints FROM users 
            JOIN (SELECT team, sum(points) as 'totalPoints' FROM users GROUP BY team) 
            AS summed ON summed.team = users.team WHERE users.team = 'Zamorak';`, (err, result, fields) => {
                    if (err) throw err;
                    console.log(result);
                });

            // Finally, if the provided argument did not match any of the team names
            } else {
                console.log('sorry that aint one of the team names for leaderboards')
                return message.reply('something went wrong. Are you typing a valid team name?');
            }

            // Once the data has been collected and set for the embed, send the embed.
            //message.channel.send(leaderboardEmbed);

        // If the command was not run in the 'results' channel, let them know
        } else {
            return message.reply('this command can only be used in the #results channel.');
        }
    },
}