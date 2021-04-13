const config = require('../../config.json');
let { taskToggle } = require('../../index.js');
let generatetask = require('../dev/generatetask.js');
let loop;

module.exports = {
    name: 'toggle-tasks',
    description: '',
    aliases: [''],
    guildOnly: true,
    args: false,
    usage: '<>',
    cooldown: 3,
    eventStaffSpecific: true,
    channelSpecific: true,
    channelID: config.tasksChannel_id,
    execute(message, args) {
        // If taskToggle was true, set it to false and let them know tasks have been toggled off.
        if (taskToggle == true) {
            taskToggle = false;
            message.reply('tasks have been toggled \`off\`');

            // stop cycling through the thumbnails on the current task
            generatetask.stopThumbnails();
            // stop making new tasks in general
            clearInterval(loop);

            // If taskToggle was false, set it to true and let them know tasks have been toggled on.
        } else {
            taskToggle = true;
            message.reply('tasks have been toggled \`on\`');

            // stop cycling through the thumbnails on the current task
            generatetask.stopThumbnails();

            // start posting a new task every 'timeBetweenTasks' milliseconds
            clearInterval(loop);
            generatetask.execute(message, args);
            loop = setInterval(() => generatetask.execute(message, args), parseInt(config.timeBetweenTasks));
        }
    },
}