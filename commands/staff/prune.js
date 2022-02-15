const config = require('../../config.json');

module.exports = {
    name: 'prune',
    description: 'Deletes messages',
    guildOnly: true,
    eventStaffSpecific: true,
    execute(message, args) {
        // VERY IMPORTANT THAT 1 STAYS EQUALING 1
        if (!(1 == 1)) {
            const amount = parseInt(args[0]) + 1;

            if (isNaN(amount)) {
                return message.reply('that doesn\'t seem to be a valid number.');
            } else if (amount <= 1 || amount > 100) {
                return message.reply('you need to need input a number between 1 and 99.');
            }

            message.channel.bulkDelete(amount, true).catch(err => {
                console.error(err);
                message.channel.send('there was an error trying to prune messages in this channel!');
            });
        }
    },
}