const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token, mysql_host, mysql_user, mysql_password, mysql_database, basePoints, repeatPointsModifier, eventStaffRole, resultsChannel_id, submissionsChannel_id, armadyl_logo, bandos_logo, guthix_logo, saradomin_logo, zamorak_logo } = require('./config.json');
const mysql = require('mysql2');
let taskToggle = false;
module.exports = taskToggle;
let thumbnailLoop;
module.exports = { thumbnailLoop, updateRanks };

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

var con = mysql.createConnection({
    host: mysql_host,
    user: mysql_user,
    password: mysql_password,
    database: mysql_database
});

client.once('ready', () => {
    console.log('----------------------------\nEventBot is running!');
    
    con.connect(err => {
        if(err) throw err;
    });
    console.log("Connected to MySQL database!\n----------------------------");
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (command.guildOnly && message.channel.type === 'dm') {
        return message.reply('I can\'t execute that command inside DMs!');
    }

    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;

        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``
        }

        return message.channel.send(reply);
    }

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});

// DEALING WITH REACTIONS REMOVED IN "SUBMISSIONS" CHANNEL BY PEOPLE WITH "EVENT STAFF" ROLE
client.on('messageReactionAdd', async (reaction, user) => {
    const member = await reaction.message.guild.members.fetch(user);
    let memberHasRole = member.roles.cache.some(role => role.name === eventStaffRole);
    let resultsChannel = reaction.message.client.channels.cache.get(resultsChannel_id);
    
    // Only look for reactions added by people with the Event Staff role.
    if (memberHasRole) {

        // Only look for reactions added within the 'submissions' channel.
        if (reaction.message.channel.id === submissionsChannel_id) {

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

    function givePoints (emojiAdded = -1) {
        let newPoints = (5-emojiAdded+1)*parseInt(basePoints);
        if (emojiAdded == -1) {
            newPoints = Math.round(parseFloat(repeatPointsModifier)*parseInt(basePoints))
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
                teamURL = armadyl_logo;
            } else if (team == 'Bandos') {
                teamURL = bandos_logo;
            } else if (team == 'Guthix') {
                teamURL = guthix_logo;
            } else if (team == 'Saradomin') {
                teamURL = saradomin_logo;
            } else if (team == 'Zamorak') {
                teamURL = zamorak_logo;
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
});

// DEALING WITH REACTIONS REMOVED IN "SUBMISSIONS" CHANNEL BY PEOPLE WITH "EVENT STAFF" ROLE
client.on('messageReactionRemove', async (reaction, user) => {
    const member = await reaction.message.guild.members.fetch(user);
    let memberHasRole = member.roles.cache.some(role => role.name === eventStaffRole);
    let resultsChannel = reaction.message.client.channels.cache.get(resultsChannel_id);

    // Only look for reactions removed by people with the Event Staff role.
    if (memberHasRole) {
        //console.log(`${user.username} has correct role? ${memberHasRole}`);

        // Only look for reactions removed within the 'submission' channel.
        if (reaction.message.channel.id === submissionsChannel_id) {
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

    function removePoints (emojiAdded = -1) {
        let newPoints = (5-emojiAdded+1)*parseInt(basePoints);
        if (emojiAdded == -1) {
            newPoints = Math.round(repeatPointsModifier*basePoints);
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
                teamURL = armadyl_logo;
            } else if (team == 'Bandos') {
                teamURL = bandos_logo;
            } else if (team == 'Guthix') {
                teamURL = guthix_logo;
            } else if (team == 'Saradomin') {
                teamURL = saradomin_logo;
            } else if (team == 'Zamorak') {
                teamURL = zamorak_logo;
            }

            const resultsEmbed = new Discord.MessageEmbed()
            .setAuthor(`-${newPoints} points`, reactee.displayAvatarURL())
            .setThumbnail(teamURL)
            .setColor('#fa4327')
            .setDescription(`Submission: [${submissionContent}](${reaction.message.url})
            Player: <@${reactee.id}>
            Staff: <@${user.id}>
            Team: Bandos`)
            .setFooter('\u200b', 'https://oldschool.runescape.wiki/images/5/55/Ignore_button.png?33b0a')
            .setTimestamp();

            resultsChannel.send(resultsEmbed);
        });
    }
});

function updateRanks () {
    con.execute(`UPDATE users
    JOIN (SELECT 
       discord_id, points, 
       IF(@lastPoint <> points, @curRank := @curRank + @nextrank, @curRank) AS 'placement',  
       IF(@lastPoint = points, @nextrank := @nextrank + 1, @nextrank := 1) AS 'rankNoTies',  
       @lastPoint := points AS 'pointsHelper'
   FROM users 
   JOIN (SELECT @curRank := 0, @lastPoint := 0, @nextrank := 1) r 
   ORDER BY  points DESC) ranks ON (ranks.discord_id = users.discord_id)
   SET users.placement = ranks.placement;`, (err, result, fields) => {
        if (err) throw err;
    });
}

client.login(token);