const fs = require('fs');
const Discord = require('discord.js');
const { specialTaskThumbnail, submissionsChannel_id, timeBetweenTasks, timeBetweenThumbnailSwap } = require('../config.json');
let thumbnailLoop = require('../index.js');

module.exports = {
    name: 'generatetask',
    description: 'Generates a task based on json file input',
    aliases: ['gt'],
    guildOnly: true,
    args: false,
    usage: '',
    cooldown: 3,
    execute(message, args) {
        let taskList = JSON.parse(fs.readFileSync('./task_data_test.json'));

        let taskIndex = Math.floor(Math.random() * taskList.Bosses.length);
        let task = taskList.Bosses[taskIndex];
        let eligible_drops_string = '';
        let eligible_drops_amount = Object.keys(task.eligible_drops[0]).length;
        //console.log('amount of eligible drops = '+ eligible_drops_amount)
        for (let i = 0; i < eligible_drops_amount; i++) {
            //console.log(Object.keys(task.eligible_drops[0])[i]);
            eligible_drops_string += Object.keys(task.eligible_drops[0])[i] + '\n';
            //console.log(Object.values(task.eligible_drops[0])[i]);
        }
        //console.log('****');
        //console.log(eligible_drops_string);
        //console.log(Object.values(task.eligible_drops[0])[0]);
        
        const msgEmbed = new Discord.MessageEmbed()
        .setColor(`${task.msg_color}`)
        .setTitle(`${task.name}`)
        .setURL(`${task.wiki_url}`)
        .setImage(`${task.wiki_thumbnail}`)
        .setDescription(' ')
        //.addFields({ name: 'Eligible drops:', value: `${eligible_drops_string}`})
        .addFields({ name: 'Eligible drops:', value: `${eligible_drops_string}`})
        .setTimestamp();

        // loop = setInterval(() => 
        // message.channel.send(msgEmbed), 
        // parseInt(timeBetweenThumbnailSwap));

        // const isSpecialTaskRoll = Math.floor((Math.random() * 10) + 1);
        // if(isSpecialTaskRoll == 1) {
        //     msgEmbed.setColor('#fcba03').setDescription('*Golden task!*').setThumbnail(specialTaskThumbnail);
        // }

        //let thumbnailLoop;
        clearInterval(thumbnailLoop);
        thumbnailLoop = message.channel.send(msgEmbed).then(sentMsg => {
            thumbnailLoop = setInterval(() => sentMsg.edit(updateThumbnail()), timeBetweenThumbnailSwap);
        }).catch(err => console.log(err));

        //message.channel.send(msgEmbed);
        message.client.channels.cache.get(submissionsChannel_id).send(`📢  Submissions below this message should be for **${task.name}**`);

        //console.log(Object.values(task.eligible_drops[0])[0]);

        //let thumbnail = Object.values(task.eligible_drops[0])[Object.values(task.eligible_drops[0])];
        let thumbnail = ' ';
        let thumbnailIndex = 0;

        function updateThumbnail() {
            
            thumbnail = Object.values(task.eligible_drops[0])[thumbnailIndex];
            
            //console.log('previous thumbnailIndex: ' + thumbnailIndex);
            //console.log(Object.keys(task.eligible_drops[0]).length);
            if (thumbnailIndex == Object.keys(task.eligible_drops[0]).length - 1) {
                thumbnailIndex = 0;
            } else {
                thumbnailIndex++;
            }
            //console.log('previous thumbnailIndex: ' + thumbnailIndex);

            //const editedEmbed = new Discord.MessageEmbed().setThumbnail(thumbnail);
            msgEmbed.setThumbnail(thumbnail);
            return msgEmbed;
        }
    },
}