const Discord = require('discord.js');
const config = require('../../config.json');

module.exports = {
    name: 'description',
    description: 'Sends a description of the event in an embedded message. Only usable by members with the event staff role in the designated event description channel',
    guildOnly: true,
    args: false,
    cooldown: 3,
    eventStaffSpecific: true,
    channelSpecific: true,
    channelID: config.eventDescriptionChannel_id,
    execute(message) {
        const descEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Event Description')
            .setDescription('Welcome to the event! (use \`!rules\` to get a more in depth explanation, including how points are calculated)')
            .setThumbnail(message.client.user.displayAvatarURL())
            .addFields(
                { name: 'Step 1', value: `Go to ${message.guild.channels.cache.get(config.sign_upsChannel_id)} and use the \`!register <rsn>\` command to sign up for the event, and wait until you are assigned a team by someone with the ${config.eventStaffRole} role.`, inline: true },
                { name: 'Step 2', value: `Every ${msToString(config.timeBetweenTasks)}, look out for an update in ${message.guild.channels.cache.get(config.tasksChannel_id)} with a new task to complete and a list of eligible drops for that task.`, inline: true },
                { name: 'Step 3', value: `Race against other teams to get a drop from that task, posting in ${message.guild.channels.cache.get(config.submissionsChannel_id)} using the \`!submit <drop name>\` command with a valid picture of your drop. Valid pictures should show the drop and include your team name, date, and time in the chat box.\n\nIf your team has already submitted a drop for the current task but you want to keep doing that content, don\'t worry! Your team can submit more than one submission per task, although you will get less points for those extra submissions.\n\nGo quick, because submissions only count if they are posted while that task is active. Once a new task has been posted in ${message.guild.channels.cache.get(config.tasksChannel_id)}, unsubmitted drops from previous tasks are no longer accepted.` },
                { name: 'Step 4', value: `Check how you and your team stack up against the competition in ${message.guild.channels.cache.get(config.resultsChannel_id)} using the \`!leaderboard\` command.`, inline: true },
                { name: 'Step 5.', value: `Once the event has ended, the team with the most points wins!`, inline: true }
            )
            .setFooter(`Questions? Message anyone with the ${config.eventStaffRole} role or use the !help command`);

        message.delete();

        return message.channel.send(descEmbed);
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