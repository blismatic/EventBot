const Discord = require('discord.js');
const config = require('../../config.json');

module.exports = {
    name: 'rules',
    description: 'Displays the rules of the event. Must be used inside the server the bot is on.',
    guildOnly: true,
    args: false,
    cooldown: 3,
    execute(message, args) {
        // Do something here.
        const rulesEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Event Rules')
            .addFields(
                { name: '📌', value: `Every ${msToString(config.timeBetweenTasks)}, I will make a new post in ${message.guild.channels.cache.get(config.tasksChannel_id)} with a new task to complete and a list of eligible drops from that task.` },
                { name: '📌', value: `If you obtain any of the eligible drops before a new task is posted, submit a valid screenshot in ${message.guild.channels.cache.get(config.submissionsChannel_id)}.` },
                { name: '📌', value: `Event staff will go through ${message.guild.channels.cache.get(config.submissionsChannel_id)} and assign valid submissions with a reaction of \u0031\u20E3 \u0032\u20E3 \u0033\u20E3 \u0034\u20E3 or \u0035\u20E3 based on the order that they were submitted. The bot will assign points based on these reactions. If it is a repeat submission, event staff should react with a \u2705` },
                { name: '📌', value: `The first team to submit a valid drop gets the \u0031\u20E3 reaction, and will receive 5x the base amount of points. The second team gets the \u0032\u20E3 reaction, and receives 4x the base amount of points, and so on and so forth. Subsequent submissions from any team who has already submitted a drop will be awarded ${config.repeatPointsModifier}x the base amount of points (currently ${config.basePoints}).\n\nThis way the sooner a drop is submitted in your teams name, the more points your team will receive for that task. Those who want to continue doing the content will still have the opportunity to contribute and gain points.` },
                { name: '📌', value: `${message.guild.channels.cache.get(config.resultsChannel_id)} will be updated every time a submitted drop is awarded points. Use the \`!leaderboard\` command to see stats about all of the teams participating, a particular team, or even a particular user! (for more information, type \`!help leaderboard\`)` },
            )
            .setTimestamp()
            .setFooter(`Questions? Message anyone with the ${config.eventStaffRole} role`);

        return message.author.send(rulesEmbed)
            .then(() => {
                if (message.channel.type === 'dm') return;
                message.reply('I\'ve sent you a DM with the rules of the event.');
            })
            .catch(error => {
                console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
                message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
            });
    },
}

function msToString(ms) {
    let seconds = (ms / 1000) | 0;
    ms -= seconds * 1000;

    let minutes = (seconds / 60) | 0;
    seconds -= minutes * 60;

    let hours = (minutes / 60) | 0;
    minutes -= hours * 60;

    let days = (hours / 24) | 0;
    hours -= days * 24;

    let weeks = (days / 7) | 0;
    days -= weeks * 7;

    let result = [];
    if (weeks != 0) {
        if (weeks == 1) {
            result.push(`${weeks} week`);
        } else {
            result.push(`${weeks} weeks`);
        }
    }
    if (days != 0) {
        if (days == 1) {
            result.push(`${days} day`);
        } else {
            result.push(`${days} days`);
        }
    }
    if (hours != 0) {
        if (hours == 1) {
            result.push(`${hours} hour`);
        } else {
            result.push(`${hours} hours`);
        }
    }
    if (minutes != 0) {
        if (minutes == 1) {
            result.push(`${minutes} minute`);
        } else {
            result.push(`${minutes} minutes`);
        }
    }
    if (seconds != 0) {
        if (seconds == 1) {
            result.push(`${seconds} second`);
        } else {
            result.push(`${seconds} seconds`);
        }
    }
    if (ms != 0) {
        if (ms == 1) {
            result.push(`${ms} millisecond`);
        } else {
            result.push(`${ms} milliseconds`);
        }
    }

    return result.join(', ');
}