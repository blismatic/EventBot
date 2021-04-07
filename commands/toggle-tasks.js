const { tasksChannel_id, timeBetweenTasks, eventStaffRole } = require('../config.json');
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
        if (message.member.roles.cache.some(role => role.name === eventStaffRole)) {
            
            // Only allow the command to be executed in the 'tasks' channel.
            if (message.channel.id === tasksChannel_id) {

                // If taskToggle was true, set it to false and let them know tasks have been toggled off.
                if (taskToggle == true) {
                    taskToggle = false;
                    message.reply('tasks have been toggled \`off\`');

                    generatetask.stopThumbnails();
                    clearInterval(loop);

                // If taskToggle was false, set it to true and let them know tasks have been toggled on.
                } else {
                    taskToggle = true;
                    message.reply('tasks have been toggled \`on\`');
                    
                    generatetask.stopThumbnails();
                    clearInterval(loop);
                    generatetask.execute(message, args);
                    loop = setInterval(() => generatetask.execute(message,args), parseInt(timeBetweenTasks));
                }

            } else {
                return message.reply('sorry, this command must be run in the tasks channel')
            }

        } else {
            return message.reply('sorry, you do not have the correct permissions to use this command.');
        }
    },
}