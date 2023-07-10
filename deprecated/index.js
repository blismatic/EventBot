const fs = require('fs');
// const Discord = require('discord.js');
const { Client, Events, GatewayIntentBits } = require('discord.js');
// const mysql = require('mysql2');
const priv = require('./credentials.json');
const config = require('./config.json');
// let con = mysql.createConnection({ host: priv.mysql_host, user: priv.mysql_user, password: priv.mysql_password, database: priv.mysql_database });
let taskToggle = false;
let thumbnailLoop;
// module.exports = { con, taskToggle, thumbnailLoop, updateRanks };
module.exports = { taskToggle, thumbnailLoop, updateRanks };

// const client = new Discord.Client();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Discord.Collection();

// Add all the <command>.js files from the commands folder into the client.commands collection.
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.name, command);
    }
}

// Add all the client events from the events folder into the client.once() and client.on() methods.
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.login(priv.token);

function updateRanks() {
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