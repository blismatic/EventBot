const fs = require('fs');
const Discord = require('discord.js');
const { specialTaskThumbnail, submissionsChannel_id } = require('../config.json');

module.exports = {
    name: 'generatetask',
    description: 'Generates a task based on json file input',
    aliases: ['gt'],
    guildOnly: true,
    args: false,
    usage: '',
    cooldown: 3,
    execute(message, args) {
        let taskList = JSON.parse(fs.readFileSync('./pvm_event_json_example.json'));

        let taskIndex = Math.floor(Math.random() * taskList.Bosses.length);
        let task = taskList.Bosses[taskIndex];
        
        const msgEmbed = new Discord.MessageEmbed()
        .setColor(`${task.msg_color}`)
        .setTitle(`${task.name}`)
        .setURL(`${task.wiki_url}`)
        .setImage(`${task.wiki_thumbnail}`)
        .setDescription('')
        .addFields({ name: 'Eligible drops:', value: `${task.eligible_drops}`})
        .setTimestamp();

        // const isSpecialTaskRoll = Math.floor((Math.random() * 10) + 1);
        // if(isSpecialTaskRoll == 1) {
        //     msgEmbed.setColor('#fcba03').setDescription('*Golden task!*').setThumbnail(specialTaskThumbnail);
        // }

        message.channel.send(msgEmbed);
        message.client.channels.cache.get(submissionsChannel_id).send(`📢  Submissions below this message should be for **${task.name}**`);
    },
}