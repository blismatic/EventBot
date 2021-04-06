const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token, mysql_host, mysql_user, mysql_password, mysql_database, basePoints } = require('./config.json');
const mysql = require('mysql2');

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
    let memberHasRole = member.roles.cache.some(role => role.name === 'Event Staff');
    
    // Only look for reactions added by people with the Event Staff role.
    if (memberHasRole) {
        console.log(`${user.username} has correct role? ${memberHasRole}`);

        // Only look for reactions added within the 'submissions' channel.
        if (reaction.message.channel.id === '827761465053413376') {
            console.log(`messageReactionAdd detected in correct channel? ${reaction.message.channel.id === '827761465053413376'}`);
            let resultsChannel = reaction.message.client.channels.cache.get('827762885902991452');

            // If the reaction is one of the three we are looking for, do something.
            if (reaction.emoji.name == '1️⃣') {
                con.query(`UPDATE users SET points = points+? WHERE discord_id = ?`, [3*parseInt(basePoints), reaction.message.author.id], (err, result, fields) => {
                    if (err) throw err;
                    console.log(`DB updated, ${reaction.message.author.username} was awarded ${3*parseInt(basePoints)} points`);
                    resultsChannel.send(`${reaction.message.author.username} was awarded ${3*parseInt(basePoints)} points by ${user.username} for this submission:\n${reaction.message.url}`);
                });
            }
            if (reaction.emoji.name == '2️⃣') {
                con.query(`UPDATE users SET points = points+? WHERE discord_id = ?`, [2*parseInt(basePoints), reaction.message.author.id], (err, result, fields) => {
                    if (err) throw err;
                    console.log(`DB updated, ${reaction.message.author.username} was awarded ${2*parseInt(basePoints)} points`);
                    resultsChannel.send(`${reaction.message.author.username} was awarded ${2*parseInt(basePoints)} points by ${user.username} for this submission:\n${reaction.message.url}`);
                })
            }
            if (reaction.emoji.name == '3️⃣') {
                con.query(`UPDATE users SET points = points+? WHERE discord_id = ?`, [1*parseInt(basePoints), reaction.message.author.id], (err, result, fields) => {
                    if (err) throw err;
                    console.log(`DB updated, ${reaction.message.author.username} was awarded ${1*parseInt(basePoints)} points`);
                    resultsChannel.send(`${reaction.message.author.username} was awarded ${1*parseInt(basePoints)} points by ${user.username} for this submission:\n${reaction.message.url}`);
                })
            }
        }
    }
});

// DEALING WITH REACTIONS REMOVED IN "SUBMISSIONS" CHANNEL BY PEOPLE WITH "EVENT STAFF" ROLE
client.on('messageReactionRemove', async (reaction, user) => {
    const member = await reaction.message.guild.members.fetch(user);
    let memberHasRole = member.roles.cache.some(role => role.name === 'Event Staff');

    // Only look for reactions removed by people with the Event Staff role.
    if (memberHasRole) {
        console.log(`${user.username} has correct role? ${memberHasRole}`);

        // Only look for reactions removed within the 'submission' channel.
        if (reaction.message.channel.id === '827761465053413376') {
            console.log(`messageReactionAdd detected in correct channel? ${reaction.message.channel.id === '827761465053413376'}`);
            let resultsChannel = reaction.message.client.channels.cache.get('827762885902991452');

            // If the reaction removed is one of the ones we are looking for, do something.
            if (reaction.emoji.name == '1️⃣') {
                con.query(`UPDATE users SET points = points-? WHERE discord_id = ?`, [3*parseInt(basePoints), reaction.message.author.id], (err, result, fields) => {
                    if (err) throw err;
                    console.log(`DB updated, ${reaction.message.author.username} was awarded ${-3*parseInt(basePoints)} points`);
                    resultsChannel.send(`${reaction.message.author.username} was awarded ${-3*parseInt(basePoints)} points by ${user.username} for this submission:\n${reaction.message.url}`);
                });
            }
            if (reaction.emoji.name == '2️⃣') {
                con.query(`UPDATE users SET points = points-? WHERE discord_id = ?`, [2*parseInt(basePoints), reaction.message.author.id], (err, result, fields) => {
                    if (err) throw err;
                    console.log(`DB updated, ${reaction.message.author.username} was awarded ${-2*parseInt(basePoints)} points`);
                    resultsChannel.send(`${reaction.message.author.username} was awarded ${-2*parseInt(basePoints)} points by ${user.username} for this submission:\n${reaction.message.url}`);
                });
            }
            if (reaction.emoji.name == '3️⃣') {
                con.query(`UPDATE users SET points = points-? WHERE discord_id = ?`, [1*parseInt(basePoints), reaction.message.author.id], (err, result, fields) => {
                    if (err) throw err;
                    console.log(`DB updated, ${reaction.message.author.username} was awarded ${-1*parseInt(basePoints)} points`);
                    resultsChannel.send(`${reaction.message.author.username} was awarded ${-1*parseInt(basePoints)} points by ${user.username} for this submission:\n${reaction.message.url}`);
                });
            }
        }
    }
})

client.login(token);