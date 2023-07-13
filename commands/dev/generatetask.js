const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const fs = require('node:fs');
let thumbnailLoop = require('../../index.js');
module.exports = thumbnailLoop;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generatetask')
        .setDescription('Pick a random task to display. Only for testing purposes.'),
    stopThumbnails() {
        clearInterval(thumbnailLoop);
    },
    async execute(interaction) {
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
        let eligibleDropsMessage = Object.entries(randomTask.eligible_drops).map(([itemName, itemImageLink], index) => {
            return `Drop ${index + 1}: ${itemName}, Image Link: ${itemImageLink}`;
        });

        // Create the embedded message, and fill it out with information from the current task.
        const embed = new EmbedBuilder()
            .setColor(randomTask.msg_color)
            .setTitle(randomTask.name)
            .setURL(randomTask.wiki_url)
            .setImage(randomTask.wiki_thumbnail)
            .setDescription(' ')
            .addFields({ name: 'Eligible drops:', value: eligibleDropsMessage })
            .setTimestamp();

        // Initialize thumbnailLink and thumbnailIndex for use in repeatedly updating the task embedded message's
        // thumbnail with an image of eacha of the tasks's eligible drops.
        let thumbnailLink = ' ';
        let thumbnailIndex = 0;

        clearInterval(thumbnailLoop);
        const channel = interaction.client.channels.cache.get(config.discord.tasksChannel_id);
        thumbnailLoop = channel.send(embed).then(sentMsg => {
            thumbnailLoop = setInterval(() => sentMsg.edit(updateThumbnail()), config.event.timeBetweenThumbnailSwap);
        }).catch(err => console.log(err));

        // Finally, send a message in the submissions channel acting as a record of what the current task is at the time of execution.
        const submissionsChannel = interaction.client.channels.cache.get(config.discord.submissionsChannel_id);
        submissionsChannel.send(`📢  Submissions below this message should be for **${randomTask.name}**`);
    },
};