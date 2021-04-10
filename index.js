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

const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.name, command);
    }
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

let con = mysql.createConnection({
    host: mysql_host,
    user: mysql_user,
    password: mysql_password,
    database: mysql_database
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