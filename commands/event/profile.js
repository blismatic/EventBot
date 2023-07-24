const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../../credentials.json');
const mysql = require('mysql2/promise');

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
        const guildId = interaction.guild.id;
        const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });

        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'team') {
            const target = interaction.options.getString('target');
            // If the provided team name is not one of the valid teams, tell the user and stop running.
            // const validTeamNames = config[guildId].teams.map(team => team.name);
            const validTeamNames = await getValidTeamsNames(guildId);
            if (!validTeamNames.includes(target)) {
                return interaction.reply({ content: `\`${target}\` is not a valid team name. Valid names are \`${validTeamNames}\``, ephemeral: true });
            }

            // Construct the basic embed.
            const team = await getTeamObjectByTeamName(guildId, target);
            const embed = new EmbedBuilder()
                .setTitle(`Team ${target}'s profile`)
                .setThumbnail(team.logo)
                .setColor(team.color);

            // Add the team's points and placement within the event.
            // Getting placement...
            let [rows, fields] = await con.execute(`SELECT team, SUM(points) as 'total' FROM users WHERE guild_id = ? GROUP BY team ORDER BY SUM(points) DESC;`, [guildId]);
            let placement = 0;
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].team === target) {
                    placement = i + 1;
                }
            }

            // Getting total points...
            let [rows2, fields2] = await con.execute(`SELECT rsn, points, summed.totalPoints, discord_id
            FROM users u
            JOIN (SELECT team, sum(points) as 'totalPoints' FROM users WHERE guild_id = ? GROUP BY team)
            AS summed ON summed.team = u.team
            WHERE u.team = ? AND u.guild_id = ?;`, [guildId, target, guildId]);
            let totalTeamPoints = 0;
            if ((rows2.length > 0) && (rows2[0].hasOwnProperty('totalPoints'))) {
                totalTeamPoints = rows2[0].totalPoints;
            }

            // Getting submissions from everyone on the team...
            let [rows3, fields3] = await con.execute(`SELECT u.discord_id, u.rsn, i.item_name, i.item_source, i.points, i.submission_date, i.submission_url
            FROM users u
            JOIN items i ON u.guild_id = i.guild_id AND u.discord_id = i.discord_id
            WHERE u.team = ? AND u.guild_id = ?
            ORDER BY i.submission_date DESC;`, [team.name, guildId]);

            embed.addFields({ name: 'Standing', value: `${Number(totalTeamPoints).toLocaleString()} points, ${getOrdinalSuffix(placement)} place`, inline: true });
            embed.addFields({ name: 'Submissions', value: `${rows3.length}`, inline: true });
            embed.addFields({ name: 'Members', value: `${rows2.length}`, inline: true });

            // Make a multiline string containing the 5 most recent submissions
            let submissionsString = '';
            let recentSubmissions = rows3.slice(0, 5); // Limit to the 5 most recent submissions from the team.
            if (recentSubmissions.length > 0) {
                for (let s of recentSubmissions) {
                    const user = await interaction.client.users.fetch(s.discord_id);
                    submissionsString += `${formatDate(s.submission_date)} [${s.item_name} from ${s.item_source}](${s.submission_url}) by ${user} (+${s.points})\n`;
                }
                embed.addFields({ name: `Recent submissions`, value: submissionsString });
            } else {
                embed.addFields({ name: 'Recent submissions', value: 'No submissions yet...' });
            }

            // Finally, send the response.
            await con.end();
            return interaction.reply({ embeds: [embed], allowedMentions: { users: [] } });

        } else if (subcommand === 'user') {
            const target = interaction.options.getUser('target');
            console.log('Do some user specific stuff here.');
            // If the provided user is not registered in the event, tell the user and stop running.
            let [testRows, testFields] = await con.execute(`SELECT discord_id FROM users WHERE guild_id = ?;`, [guildId]);
            const validDiscordIds = testRows.map((p) => p.discord_id);
            if (!validDiscordIds.includes(target.id)) {
                return interaction.reply({ content: `${target} is not a valid user. Are you sure they have registered for the event?`, ephemeral: true });
            }

            // If they are registered in the event, search for all of their submissions in the items table.
            // let [rows, fields] = await con.execute(`SELECT * FROM u${target.id} ORDER BY submission_date DESC;`);
            let [rows, fields] = await con.execute(`SELECT u.discord_id, u.rsn, i.item_name, i.item_source, i.points, i.submission_date, i.submission_url
            FROM users u
            JOIN items i ON u.discord_id = i.discord_id AND u.guild_id = i.guild_id
            WHERE u.discord_id = ? and u.guild_id = ?
            ORDER BY i.submission_date DESC;`, [target.id, guildId]);
            const totalPoints = rows.reduce((total, item) => total + item.points, 0);
            const totalSubmissions = rows.length;

            // Construct the basic embed.
            const rsn = await getRsnFromDiscordId(guildId, target.id);
            const embed = new EmbedBuilder()
                .setTitle(`${rsn}'s profile`)
                .setURL(getHiscoresFromRsn(rsn))
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: 'Points', value: Number(totalPoints).toLocaleString(), inline: true },
                    { name: 'Submissions', value: Number(totalSubmissions).toLocaleString(), inline: true },
                    { name: 'Discord', value: `${target}`, inline: true }
                );

            // If the user actually has submissions, add them to a single field.
            if (totalSubmissions > 0) {
                let tempString = '';
                const trimmedRows = rows.slice(0, 5); // Limit the amount of submissions to at most 5.
                for (let row of trimmedRows) {
                    // eg. 'Lightbearer from Tombs of Amascut (+112)'
                    // tempString += `${formatDate(row.submission_date)} - [${row.item} from ${row.source}](${row.submission_url}) (+${row.points})\n`;
                    tempString += `${formatDate(row.submission_date)} [${row.item_name} from ${row.item_source}](${row.submission_url}) (+${row.points})\n`;
                }
                embed.addFields({ name: 'Recent submissions', value: tempString });
            } else {
                embed.addFields({ name: 'Recent submissions', value: 'No submissions yet...' });
            }

            // If they are currently on a team, show that team logo and name at the top.
            const team = await getTeamObjectByDiscordId(guildId, target.id);
            console.log(team);
            if (team) {
                embed.setAuthor({ name: team.name, iconURL: team.logo });
                embed.setColor(team.color);
            }

            // Finally, send the response.
            await con.end();
            return interaction.reply({ embeds: [embed], allowedMentions: { users: [] } });
        }
    },
};

async function getTeamObjectByDiscordId(guildId, discordId) {
    const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });

    try {
        const [userTeamRow, fields] = await con.execute(
            `SELECT team FROM users WHERE discord_id = ? AND guild_id = ?`,
            [discordId, guildId]
        );

        if (userTeamRow.length === 0) {
            console.log('User not found or not part of the guild.');
            return;
        }

        const user_team = userTeamRow[0].team;

        const [teamInfoRow] = await con.execute(
            `
            SELECT 
                CASE 
                    WHEN team_0_name = ? THEN team_0_name
                    WHEN team_1_name = ? THEN team_1_name
                    WHEN team_2_name = ? THEN team_2_name
                    WHEN team_3_name = ? THEN team_3_name
                    WHEN team_4_name = ? THEN team_4_name
                    WHEN team_5_name = ? THEN team_5_name
                    WHEN team_6_name = ? THEN team_6_name
                    WHEN team_7_name = ? THEN team_7_name
                    WHEN team_8_name = ? THEN team_8_name
                    WHEN team_9_name = ? THEN team_9_name
                END AS name,
                CASE 
                    WHEN team_0_name = ? THEN team_0_color
                    WHEN team_1_name = ? THEN team_1_color
                    WHEN team_2_name = ? THEN team_2_color
                    WHEN team_3_name = ? THEN team_3_color
                    WHEN team_4_name = ? THEN team_4_color
                    WHEN team_5_name = ? THEN team_5_color
                    WHEN team_6_name = ? THEN team_6_color
                    WHEN team_7_name = ? THEN team_7_color
                    WHEN team_8_name = ? THEN team_8_color
                    WHEN team_9_name = ? THEN team_9_color
                END AS color,
                CASE 
                    WHEN team_0_name = ? THEN team_0_logo
                    WHEN team_1_name = ? THEN team_1_logo
                    WHEN team_2_name = ? THEN team_2_logo
                    WHEN team_3_name = ? THEN team_3_logo
                    WHEN team_4_name = ? THEN team_4_logo
                    WHEN team_5_name = ? THEN team_5_logo
                    WHEN team_6_name = ? THEN team_6_logo
                    WHEN team_7_name = ? THEN team_7_logo
                    WHEN team_8_name = ? THEN team_8_logo
                    WHEN team_9_name = ? THEN team_9_logo
                END AS logo
            FROM
                config_teams
            WHERE guild_id = ?;
            `,
            [user_team, user_team, user_team, user_team, user_team, user_team, user_team, user_team, user_team, user_team,
                user_team, user_team, user_team, user_team, user_team, user_team, user_team, user_team, user_team, user_team,
                user_team, user_team, user_team, user_team, user_team, user_team, user_team, user_team, user_team, user_team,
                guildId]
        );

        if (teamInfoRow.length === 0) {
            console.log('Team information not found.');
            return;
        }

        await con.end();
        return teamInfoRow[0];
    } catch (error) {
        console.error('Error occurred:', error);
    }
    // } finally {
    //     await con.end();

    // }
}

async function getTeamObjectByTeamName(guildId, name) {
    const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });

    try {
        const [teamInfoRow] = await con.execute(
            `
        SELECT 
            CASE 
                WHEN team_0_name = ? THEN team_0_name
                WHEN team_1_name = ? THEN team_1_name
                WHEN team_2_name = ? THEN team_2_name
                WHEN team_3_name = ? THEN team_3_name
                WHEN team_4_name = ? THEN team_4_name
                WHEN team_5_name = ? THEN team_5_name
                WHEN team_6_name = ? THEN team_6_name
                WHEN team_7_name = ? THEN team_7_name
                WHEN team_8_name = ? THEN team_8_name
                WHEN team_9_name = ? THEN team_9_name
            END AS name,
            CASE 
                WHEN team_0_name = ? THEN team_0_color
                WHEN team_1_name = ? THEN team_1_color
                WHEN team_2_name = ? THEN team_2_color
                WHEN team_3_name = ? THEN team_3_color
                WHEN team_4_name = ? THEN team_4_color
                WHEN team_5_name = ? THEN team_5_color
                WHEN team_6_name = ? THEN team_6_color
                WHEN team_7_name = ? THEN team_7_color
                WHEN team_8_name = ? THEN team_8_color
                WHEN team_9_name = ? THEN team_9_color
            END AS color,
            CASE 
                WHEN team_0_name = ? THEN team_0_logo
                WHEN team_1_name = ? THEN team_1_logo
                WHEN team_2_name = ? THEN team_2_logo
                WHEN team_3_name = ? THEN team_3_logo
                WHEN team_4_name = ? THEN team_4_logo
                WHEN team_5_name = ? THEN team_5_logo
                WHEN team_6_name = ? THEN team_6_logo
                WHEN team_7_name = ? THEN team_7_logo
                WHEN team_8_name = ? THEN team_8_logo
                WHEN team_9_name = ? THEN team_9_logo
            END AS logo
        FROM
            config_teams
        WHERE guild_id = ?;
        `,
            [name, name, name, name, name, name, name, name, name, name,
                name, name, name, name, name, name, name, name, name, name,
                name, name, name, name, name, name, name, name, name, name,
                guildId]
        );

        if (teamInfoRow.length === 0) {
            console.log('Team not found or not part of the guild.');
            await con.end();
            return;
        }

        await con.end();

        return teamInfoRow[0];
    } catch (error) {
        console.error('Error occurred:', error);
        await con.end();
    }
}

async function getRsnFromDiscordId(guildId, discordId) {
    const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });
    const [rows, fields] = await con.execute(`SELECT rsn FROM users WHERE discord_id = ? AND guild_id = ?;`, [discordId, guildId]);
    await con.end();
    if (rows[0].rsn) {
        return rows[0].rsn;
    } else {
        return false;
    }

}

async function getValidTeamsNames(guildId) {
    const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });
    const [rows, fields] = await con.execute(`
    SELECT team_0_name, team_1_name, team_2_name, team_3_name, team_4_name, team_5_name, team_6_name, team_7_name, team_8_name, team_9_name
    FROM config_teams WHERE guild_id = ?;`, [guildId])

    const result = Object.values(rows[0]);

    await con.end();
    return result;
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
    // return `${months[month]} ${day}${suffix}, ${year}`;
    return `${year}-${month}-${day}`;
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