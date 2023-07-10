const Discord = require('discord.js');
const fs = require('fs');
const config = require('../../config.json');
const taskDataFileName = './task_data.json';
let taskData = fs.readFileSync(taskDataFileName);
let taskList = JSON.parse(taskData);

module.exports = {
    name: 'tasks',
    description: 'Shows a list of all tasks split into enabled and disabled tasks.',
    aliases: ['t'],
    guildOnly: true,
    usage: '<enable/disable> <boss name>',
    cooldown: 3,
    execute(message, args) {
        // Member just wants to see list of all tasks
        if (args.length == 0) {
            return updateTasksEmbed();
        }

        if (!message.member.roles.cache.some(role => role.name === config.eventStaffRole)) {
            return message.reply('something went wrong, it looks like you don\'t have the right role to do this.');
        }

        let taskName = args.slice(1).join(" ");
        let taskInTaskList = false;
        let taskNameIsTaskType = false;
        for (const taskType in taskList) {
            if (taskName == taskType) {
                taskNameIsTaskType = true;
            }

            for (const taskIndex in taskList[taskType]) {
                let currentTask = taskList[taskType][taskIndex];
                if (currentTask.name == taskName) {
                    taskInTaskList = true;
                }
            }
        }

        if (((args[0] == 'enable') || (args[0] == 'disable')) && (taskInTaskList == true)) {
            // Member wants to toggle a task that is actually in the task list.
            if (args[0] == 'enable') {
                writeToTaskData(true, taskName);
            } else {
                writeToTaskData(false, taskName);
            }
            return updateTasksEmbed();

        } else if (((args[0] == 'enable') || (args[0] == 'disable')) && (taskName == 'all')) {
            //Member wants to enable or disable all tasks
            for (const taskType in taskList) {
                for (const taskIndex in taskList[taskType]) {
                    let currentTask = taskList[taskType][taskIndex];
                    if (args[0] == 'enable') {
                        writeToTaskData(true, currentTask.name);
                    } else {
                        writeToTaskData(false, currentTask.name);
                    }
                }
            }
            return updateTasksEmbed();

        } else if (((args[0] == 'enable') || (args[0] == 'disable')) && (taskNameIsTaskType)) {
            // Member wants to enable or disable all tasks of a specific type
            for (const taskType in taskList) {
                if (taskType == taskName) {
                    for (const taskIndex in taskList[taskType]) {
                        let currentTask = taskList[taskType][taskIndex];
                        if (args[0] == 'enable') {
                            writeToTaskData(true, currentTask.name);
                        } else {
                            writeToTaskData(false, currentTask.name);
                        }
                    }
                }
            }
            return updateTasksEmbed();

        } else {
            return message.reply('something went wrong, are you using the command correctly?');
        }



        function updateTasksEmbed() {
            const tasksEmbed = new Discord.MessageEmbed().setTitle('All Tasks').setTimestamp().setColor('#00242e');

            for (taskType in taskList) {
                let taskTypeEnabledString = '';
                let taskTypeDisabledString = '';

                for (taskIndex in taskList[taskType]) {
                    let currentTask = taskList[taskType][taskIndex];

                    if (currentTask.enabled == true) {
                        taskTypeEnabledString += `[${currentTask.name}](${currentTask.wiki_url})\n`;
                    } else {
                        taskTypeDisabledString += `[${currentTask.name}](${currentTask.wiki_url})\n`;
                    }
                }

                if (taskTypeEnabledString.length == 0) taskTypeEnabledString = '\u200b';
                if (taskTypeDisabledString.length == 0) taskTypeDisabledString = '\u200b';

                tasksEmbed.addField(`${taskType}: Enabled`, taskTypeEnabledString, true);
                tasksEmbed.addField(`${taskType}: Disabled`, taskTypeDisabledString, true);
                tasksEmbed.addField('\u200b', '\u200b');
            }

            return message.channel.send(tasksEmbed);
        }

        function writeToTaskData(toggle, taskName) {
            if (!message.member.roles.cache.some(role => role.name === config.eventStaffRole)) {
                return message.reply('something went wrong, it looks like you don\'t have the right role to do this.');
            }

            for (taskType in taskList) {
                for (taskIndex in taskList[taskType]) {
                    let currentTask = taskList[taskType][taskIndex];
                    if (currentTask.name == taskName) {

                        currentTask.enabled = toggle;
                    }
                }
            }

            fs.writeFileSync(taskDataFileName, JSON.stringify(taskList, null, 2), function writeJSON(err) {
                if (err) return console.log(err);
            });

        }
    }
}

