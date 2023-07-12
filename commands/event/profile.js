const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../../credentials.json');
const mysql = require('mysql2/promise');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View a team or user profile for this event.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('team')
                .setDescription('View a specific team profile.')
                .addStringOption(option =>
                    option.setName('target')
                        .setDescription('The name of the team to view')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('View a specific user profile.')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to view')
                        .setRequired(true))
        ),
    async execute(interaction) {
        const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });
        console.log('I am here');

        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'team') {
            const target = interaction.options.getString('target');
            console.log('Do some team specific stuff here.');
            // If the provided team name is not one of the valid teams, tell the user and stop running.
            const validTeamNames = config.teams.map(team => team.name);
            if (!validTeamNames.includes(target)) {
                return interaction.reply({ content: `\`${target}\` is not a valid team name. Valid names are \`${validTeamNames}\``, ephemeral: true });
            }

            // Construct the basic embed.
            const team = findTeamByName(target);
            const embed = new EmbedBuilder()
                .setTitle(`Team ${target}'s profile`)
                .setThumbnail(team.logo)
                .setColor(team.color);

            // Add the team's points and placement within the event.
            let [rows, fields] = await con.execute(`SELECT team, SUM(points) as 'total' FROM users GROUP BY teams ORDER BY SUM(points) DESC;`);
            let placement = -1;
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].team === target) {
                    placement = i + 1;
                }
            }

            let [rows2, fields2] = await con.execute(`SELECT rsn, points, summed.totalPoints, discord_id FROM users JOIN (SELECT team, sum(points) as 'totalPoints' FROM users GROUP BY team) AS summed ON summed.team = users.team WHERE users.team = '${target}' ORDER BY points DESC;`);
            const totalTeamPoints = rows2[0].totalPoints;
            embed.addFields({ name: 'Standing', value: `${Number(totalTeamPoints).toLocaleString()} points, ${getOrdinalSuffix(placement)} place` });

            // Make a multiline string containing all of the team members and their invidividual points, and add it to the embed.
            let tempString = '';
            for (let i = 0; i < rows2.length; i++) {
                const rsn = rows2[i].rsn;
                const user = interaction.client.users.fetch(rows2[i].discord_id);
                const points = rows2[i].points
                tempString += `${i + 1}. [${rsn}](${getHiscoresFromRsn(rsn)}) ${user} - ${Number(points).toLocaleString()} points\n`
            }
            embed.addFields({ name: 'Members', value: tempString });

            // Finally, send the response.
            return interaction.reply({ embeds: [embed], allowedMentions: { users: [] } });

        } else if (subcommand === 'user') {
            const target = interaction.options.getUser('target');
            console.log('Do some user specific stuff here.');
            // If the provided user is not registered in the event, tell the user and stop running.
            const validUserNames = config.teams.map((team) => team.members).reduce((acc, members) => acc.concat(members), []);
            if (!validUserNames.includes(target)) {
                return interaction.reply({ content: `\`${target}\` is not a valid user. Are you sure they have registered for the event?`, ephemeral: true });
            }

            // If they are registered in the event, search for their own table in the database.
            let [rows, fields] = await con.execute(`SELECT * from ? ORDER BY \`date\` DESC;`, [`u${target.id}`])
            const totalPoints = rows.reduce((total, item) => total + item.points, 0);
            const totalSubmissions = rows.length;

            // Construct the basic embed.
            const rsn = getRsnFromDiscordId(target.id);
            const embed = new EmbedBuilder()
                .setTitle(`${rsn}'s profile`)
                .setURL(getHiscoresFromRsn(rsn))
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: 'Points', value: Number(totalPoints).toLocaleString(), inline: true },
                    { name: 'Submissions', value: Number(totalSubmissions).toLocaleString(), inline: true },
                    { name: 'Discord', value: target, inline: true }
                );

            // If the user actually has submissions, add them to a single field.
            if (totalSubmissions > 0) {
                let tempString = '';
                const trimmedRows = rows.slice(0, 5); // Limit the amount of submissions to at most 5.
                for (let row of trimmedRows) {
                    // eg. 'Lightbearer from Tombs of Amascut (+112)'
                    tempString += `${formatDate(row.date)} - [${row.drop} from ${row.boss}](${row.submission}) (+${row.points})\n`;
                }
                embed.addFields({ name: 'Recent submissions', value: tempString });
            }

            // If they are currently on a team, show that team logo and name at the top.
            const team = findTeamByRsn(rsn);
            if (team) {
                embed.setAuthor({ name: team.name, iconURL: team.logo });
                embed.setColor(team.color);
            }

            // Finally, send the response.
            return interaction.reply({ embeds: [embed], allowedMentions: { users: [] } });
        }
    },
};

function findTeamByRsn(memberName) {
    const teams = config.teams
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].members.includes(memberName)) {
            return teams[i];
        }
    }
    return false;
}

function findTeamByName(name) {
    let team = teams.find(team => team.name === name);
    return team;
}

async function getRsnFromDiscordId(id) {
    const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });
    const [rows, fields] = await con.execute(`SELECT rsn FROM users WHERE discord_id = ?;`, [id]);
    if (rows[0].rsn) {
        return rows[0].rsn;
    } else {
        return false;
    }
}

function getHiscoresFromRsn(rsn) {
    return `https://secure.runescape.com/m=hiscore_oldschool/hiscorepersonal?user1=${encodeURI(rsn)}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const suffixes = ["th", "st", "nd", "rd"];
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    let suffix = suffixes[(day - 20) % 10] || suffixes[day] || suffixes[0];
    return `${months[month]} ${day}${suffix}, ${year}`;
}

function getOrdinalSuffix(number) {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
        return `${number}th`;
    }

    switch (lastDigit) {
        case 1: return `${number}st`;
        case 2: return `${number}nd`;
        case 3: return `${number}rd`;
        default: return `${number}th`;
    }
}