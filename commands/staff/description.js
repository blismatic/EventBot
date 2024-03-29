const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../../credentials.json');
const mysql = require('mysql2/promise');

module.exports = {
    // channelSpecific: "eventDescriptionChannel_id",
    // roleSpecific: "eventStaffRole_id",
    data: new SlashCommandBuilder()
        .setName('description')
        .setDescription('Sends a description of the event in an embedded message.'),
    async execute(interaction) {
        const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });
        const guildId = interaction.guild.id;

        const config = await getDiscordConfigFromGuildId(guildId);

        let channels = {};
        try {
            channels = {
                sign_ups: interaction.guild.channels.cache.get(config.sign_ups_channel_id),
                tasks: interaction.guild.channels.cache.get(config.tasks_channel_id),
                submissions: interaction.guild.channels.cache.get(config.submissions_channel_id),
                results: interaction.guild.channels.cache.get(config.results_channel_id)
            };
        } catch (error) {
            console.log(error);
        }

        let eventStaffRole = {};
        try {
            eventStaffRole = interaction.guild.roles.cache.get(config.event_staff_role_id).name;
        } catch (error) {
            console.log(error);
        }

        const event = await getEventConfigFromGuildId(guildId);

        const embedObject = {
            color: 0x0099ff,
            title: 'Event Description',
            description: 'Welcome to the event!\n(use \`/rules\` to get a more in depth explanation, including how points are calculated)',
            thumbnail: {
                url: interaction.client.user.displayAvatarURL()
            },
            fields: [
                {
                    name: 'Step 1',
                    value: `Go to ${channels.sign_ups} and use the \`/register\` command to sign up for the event, and wait until you are assigned a team by someone with the ${eventStaffRole} role.`,
                    inline: true,
                },
                {
                    name: 'Step 2',
                    value: `Every ${msToString(event.time_between_tasks)}, look out for an update in ${channels.tasks} with a new task to complete and a list of eligible drops for that task.`,
                    inline: true,
                },
                {
                    name: 'Step 3',
                    value: `Race against other teams to get a drop from that task, posting in ${channels.submissions} using the \`/submit\` command with a valid picture of your drop. Valid pictures should show the drop and include your team name, date, and time in the chat box.\n\nIf your team has already submitted a drop for the current task but you want to keep doing that content, don\'t worry! Your team can submit more than one submission per task, although you will get less points for those extra submissions.\n\nGo quick, because submissions only count if they are posted while that task is active. **Once a new task has been posted in ${channels.tasks}, unsubmitted drops from previous tasks are no longer accepted.**`,
                },
                {
                    name: 'Step 4',
                    value: `Check how you and your team stack up against the competition in ${channels.results} using the \`/leaderboard\` command.`,
                    inline: true,
                },
                {
                    name: 'Step 5',
                    value: `Once the event has ended, the team with the most points wins!`,
                    inline: true,
                },
            ],
            footer: {
                text: `Questions? Message anyone with the ${eventStaffRole} role`
            },
        };

        await interaction.reply({ embeds: [embedObject] });
    },
};

function msToString(milliseconds) {
    // define time constants
    const msPerSecond = 1000;
    const msPerMinute = msPerSecond * 60;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerWeek = msPerDay * 7;

    // calculate the time units
    let remainingMs = milliseconds;
    const weeks = Math.floor(remainingMs / msPerWeek);
    remainingMs %= msPerWeek;

    const days = Math.floor(remainingMs / msPerDay);
    remainingMs %= msPerDay;

    const hours = Math.floor(remainingMs / msPerHour);
    remainingMs %= msPerHour;

    const minutes = Math.floor(remainingMs / msPerMinute);
    remainingMs %= msPerMinute;

    const seconds = Math.floor(remainingMs / msPerSecond);

    // construct the duration string
    let duration = '';
    if (weeks) {
        duration += `${weeks} week${weeks > 1 ? 's' : ''}`;
    }
    if (days) {
        if (duration) duration += ', ';
        duration += `${days} day${days > 1 ? 's' : ''}`;
    }
    if (hours) {
        if (duration) duration += ', ';
        duration += `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes) {
        if (duration) duration += ', ';
        duration += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    if (seconds) {
        if (duration) duration += ', ';
        duration += `${seconds} second${seconds > 1 ? 's' : ''}`;
    }

    // return the final duration string
    return duration;
}

async function getDiscordConfigFromGuildId(guildId) {
    const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });

    const [rows, fields] = await con.execute(`SELECT * FROM config_discord WHERE guild_id = ?;`, [guildId]);

    await con.end();
    return rows[0];
}

async function getEventConfigFromGuildId(guildId) {
    const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });

    const [rows, fields] = await con.execute(`SELECT * FROM config_event WHERE guild_id = ?;`, [guildId]);

    await con.end();
    return rows[0];
}