module.exports = {
    name: 'repeat',
    description: 'testing of repeated messages being sent.',
    aliases: [''],
    guildOnly: true,
    usage: '<>',
    cooldown: 3,
    execute(message, args) {
        function myFunc() {
            return message.channel.send('repeat test');
        }

        message.channel.send('Event will start in XYZ hours. Good luck!');

        setInterval(myFunc, 10000);
    },
}