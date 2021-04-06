const Discord = require('discord.js');

module.exports = {
    name: 'rules',
    description: 'Displays the rules of the event.',
    aliases: [''],
    guildOnly: false,
    args: false,
    usage: '<>',
    cooldown: 3,
    execute(message, args) {
        // Do something here.
        const rulesEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Event Rules')
            .addFields(
                { name: '📌 1.', value: 'Every X hours, EventBot will make a new post in #tasks with a new boss to kill and a list of eligible drops.' },
                { name: '📌 2.', value: 'If you obtain any of the eligible drops before a new task is posted, submit a valid screenshot in #submissions. The first drop per task, per team will be accepted and count for the majority  of that tasks possible points, however multiple submissions by a team will be accepted, awarding much less points. For example, if the current task is Vorkath and you submit the Dragonbone Necklace for team 1, any other submissions for team 1 will only award a small amount of points, whereas the initial Dragonbone Necklace will be worth a lot.' },
                { name: '📌 3.', value: 'Event Staff will go through #subsmissions and assign valid submissions with a reaction of 1️⃣ 2️⃣ or 3️⃣ based on the order that they were submitted. The bot will assign points based on these reactions. If it is a repeat submission, event staff should react with a ✅' },
                { name: '📌 4.', value: 'The first team to submit a valid drop gets the 1️⃣ reaction, and will receive 3x the base amount of points. The second team gets the 2️⃣ reaction, and receives 2x the base amount of points. The third team to submit gets the 3️⃣ reaction, and receives the base amount of points. Multiple submissions from any team, regardless of the order their initial drop was submitted, will be awarded 25% the base amount of points.\n\nThis way the sooner a drop is submitted in your teams name, the more points your team will receive for that task. However for those who want to continue doing the content, they still have the opportunity to contribute.' },
                { name: '📌 5.', value: 'There is a 10% chance that the task generated will be designated as a Golden Task, and point values for these tasks will be worth double, including repeat submissions (50% base amount of points rather than the regular 25%).' },
                { name: '📌 6.', value: 'The #results channel will be updated every 24 hours with a new message of the current team rankings and top point contributors from each team.' },
            )
            .setTimestamp()
            .setFooter('Questions? Message anyone with the Event Staff role');

        //message.channel.send(rulesEmbed);
        
        return message.author.send(rulesEmbed)
            .then(() => {
                if (message.channel.type === 'dm') return;
                message.reply('I\'ve sent you a DM with the rules of the event.');
            })
            .catch(error => {
                console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
                message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
            });
    },
}