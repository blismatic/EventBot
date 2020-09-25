const fs = require('fs');
const Discord = require('discord.js');
const { specialTaskThumbnail } = require('../config.json');

module.exports = {
    name: 'generatetask',
    description: 'testing for generating a task based on json file input',
    aliases: ['gt'],
    guildOnly: true,
    usage: '',
    cooldown: 3,
    execute(message, args) {
        let taskList = JSON.parse(fs.readFileSync('./pvm_event_json_example.json'));

        let prevTaskIndex = -1
        let taskIndex = Math.floor(Math.random() * taskList.Bosses.length);

        let task = taskList.Bosses[taskIndex];
        
        const msgEmbed = new Discord.MessageEmbed()
        .setColor(`${task.msg_color}`)
        .setTitle(`${task.name}`)
        .setURL(`${task.wiki_url}`)
        //.setThumbnail(`${task.wiki_thumbnail}`)
        .setImage(`${task.wiki_thumbnail}`)
        .setDescription('')
        .addFields({ name: 'Eligible drops:', value: `${task.eligible_drops}`})
        .setFooter(`1st place: XYZ   |   2nd place: XYZ   |   3rd place: XYZ`);

        let isSpecialTask = false;
        const isSpecialTaskRoll = Math.floor((Math.random() * 10) + 1);
        if(isSpecialTaskRoll == 1) {
            isSpecialTask = true;

            //msgEmbed.setColor('#fcba03').setDescription('*Golden tile!*');
            msgEmbed.setColor('#fcba03').setDescription('*Golden task!*').setThumbnail(specialTaskThumbnail);
        }

        message.channel.send(msgEmbed);
    },
}