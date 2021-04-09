//const { tasksChannel_id, timeBetweenTasks, eventStaffRole } = require('../config.json');
const config = require('../config.json');
let taskToggle = require('../index.js');
let generatetask = require('./generatetask.js');
let loop;

module.exports = {
    name: 'toggle-tasks',
    description: '',
    aliases: [''],
    guildOnly: true,
    args: false,
    usage: '<>',
    cooldown: 3,
    execute(message, args) {
        // Only allow users with the 'Event Staff' role to run this command
        if (message.member.roles.cache.some(role => role.name === config.eventStaffRole)) {
            
            // Only allow the command to be executed in the 'tasks' channel.
            if (message.channel.id === config.tasksChannel_id) {

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
                    loop = setInterval(() => generatetask.execute(message,args), parseInt(config.timeBetweenTasks));
                }

            } else {
                // If message was not sent in the 'tasks' channel, let them know.
                return message.reply('sorry, this command must be run in the tasks channel')
            }

        } else {
            // If they do not have the 'event staff' role, let them know they cant run the command.
            return message.reply('sorry, you do not have the correct permissions to use this command.');
        }
    },
}