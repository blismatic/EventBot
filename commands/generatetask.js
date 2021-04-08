const fs = require('fs');
const Discord = require('discord.js');
const { submissionsChannel_id, timeBetweenThumbnailSwap } = require('../config.json');
let thumbnailLoop = require('../index.js');
module.exports = thumbnailLoop;

module.exports = {
    name: 'generatetask',
    description: 'Generates a task based on json file input',
    aliases: ['gt'],
    guildOnly: true,
    args: false,
    usage: '',
    cooldown: 3,
    stopThumbnails() {
        clearInterval(thumbnailLoop);
    },
    execute(message, args) {
        // Load in the list of possible tasks from the task data json file.
        let taskList = JSON.parse(fs.readFileSync('./task_data_test.json'));

        // Pick a random task to use.
        let taskIndex = Math.floor(Math.random() * taskList.Bosses.length);
        let task = taskList.Bosses[taskIndex];
        
        // Build a multiline string with all of the current task's eligible drops,
        // to be used in .addField method for the embedded message about to be made.
        let eligible_drops_string = '';
        let eligible_drops_amount = Object.keys(task.eligible_drops[0]).length;
        for (let i = 0; i < eligible_drops_amount; i++) {
            eligible_drops_string += Object.keys(task.eligible_drops[0])[i] + '\n';
        }
        
        // Create the embedded message, and fill it out with information from the current task.
        const msgEmbed = new Discord.MessageEmbed()
        .setColor(`${task.msg_color}`)
        .setTitle(`${task.name}`)
        .setURL(`${task.wiki_url}`)
        .setImage(`${task.wiki_thumbnail}`)
        .setDescription(' ')
        .addFields({ name: 'Eligible drops:', value: `${eligible_drops_string}`})
        .setTimestamp();

        // *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
        // *** *** *** some code for a potential randomized "special task" worth more points than normal *** *** ***
        // *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
        // const isSpecialTaskRoll = Math.floor((Math.random() * 10) + 1);
        // if(isSpecialTaskRoll == 1) {
        //     msgEmbed.setColor('#fcba03').setDescription('*Golden task!*').setThumbnail(specialTaskThumbnail);
        // }

        // Initialize thumbnailLink and thumbnailIndex for use in repeatedly updating the task embedded message's
        // thumbnail with an image of each of the task's eligible drops.
        let thumbnailLink = ' ';
        let thumbnailIndex = 0;

        clearInterval(thumbnailLoop);
        thumbnailLoop = message.channel.send(msgEmbed).then(sentMsg => {
            thumbnailLoop = setInterval(() => sentMsg.edit(updateThumbnail()), timeBetweenThumbnailSwap);
        }).catch(err => console.log(err));

        // Finally, send a message in the submissions channel acting as a record of what the current task is at the time of execution.
        message.client.channels.cache.get(submissionsChannel_id).send(`📢  Submissions below this message should be for **${task.name}**`);

        // Helper functin to increment through the current tasks eligible drop's image links, 
        //and update the embedded task message with this new image as a thumbnail.
        function updateThumbnail() {
            // Set thumbnailLink to the current eligible drop
            thumbnailLink = Object.values(task.eligible_drops[0])[thumbnailIndex];
            
            // Increment thumbnailIndex by 1, unless it is at the last eligible drop, in which case set it back to the beginning of thumbnailIndex.
            // This serves the purpose of getting thumbnailIndex ready for the next time that updateThumbnail() is called.
            if (thumbnailIndex == Object.keys(task.eligible_drops[0]).length - 1) {
                thumbnailIndex = 0;
            } else {
                thumbnailIndex++;
            }

            // Update the task embedded message with the new thumbnail link, and return the embed.
            msgEmbed.setThumbnail(thumbnailLink);
            return msgEmbed;
        }
    },
}