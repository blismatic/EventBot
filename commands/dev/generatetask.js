const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const mysql = require('mysql2/promise');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../../credentials.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generatetask')
        .setDescription('Pick a random task to display. Only for testing purposes.'),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        // Load in the list of tasks from the task data json file.
        const entireTaskList = JSON.parse(fs.readFileSync('./task_data.json'));

        // Only get the list of 'enabled' tasks from the task data json file.
        let enabledTasks = [];
        for (let category in entireTaskList) {
            let tasksInCategory = entireTaskList[category];
            let enabledTasksInCategory = tasksInCategory.filter(task => task.enabled);
            enabledTasks = enabledTasks.concat(enabledTasksInCategory);
        }
        // console.log(enabledTasks);

        if (enabledTasks.length === 0) {
            return interaction.reply({ content: `Couldn't generate a task, make sure at least one task is enabled.`, ephemeral: true });
        }

        // Pick a random task out of the 'enabled' tasks to use.
        let randomIndex = Math.floor(Math.random() * enabledTasks.length);
        let randomTask = enabledTasks[randomIndex];

        // Build a multiline string with all of the current task's eligible drops,
        // to be used in the .addFields method for the embedded message about to be made.
        let eligibleDropsMessage = Object.entries(randomTask.eligible_drops).map(([itemName, itemLink], index) => {
            return `${index + 1}: ${itemName}`;
        });
        eligibleDropsMessage = eligibleDropsMessage.join("\n");

        // Create the embedded message, and fill it out with information from the current task.
        const embed = new EmbedBuilder()
            .setColor(randomTask.msg_color)
            .setTitle(randomTask.name)
            .setURL(randomTask.wiki_url)
            .setImage(randomTask.wiki_thumbnail)
            .setDescription(' ')
            .addFields({ name: 'Eligible drops:', value: `${eligibleDropsMessage}` })
            .setTimestamp();


        const discordConfig = await getDiscordConfig(interaction.guild.id);
        // const channel = interaction.client.channels.cache.get(config['175880957197418497'].discord.tasksChannel_id);
        const channel = interaction.client.channels.cache.get(discordConfig.tasks_channel_id);
        channel.send({ embeds: [embed] });
        await interaction.reply({ content: `Task **${randomTask.name}** has been generated in ${channel}` });

        // Finally, send a message in the submissions channel acting as a record of what the current task is at the time of execution.
        // const submissionsChannel = interaction.client.channels.cache.get(config['175880957197418497'].discord.submissionsChannel_id);
        const submissionsChannel = interaction.client.channels.cache.get(discordConfig.submissions_channel_id);
        submissionsChannel.send(`📢  Submissions below this message should be for **${randomTask.name}**`);
    },
};

async function getDiscordConfig(guildId) {
    const con = await mysql.createConnection({ host: mysql_host, user: mysql_user, password: mysql_password, database: mysql_database });

    const [rows, fields] = await con.execute(`SELECT * FROM config_discord WHERE guild_id = ?;`, [guildId]);

    await con.end();
    return rows[0];
}