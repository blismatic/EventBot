module.exports = {
    name: 'repeat2',
    description: 'testing of repeated messages being sent.',
    aliases: [''],
    guildOnly: true,
    usage: '<>',
    cooldown: 3,
    execute(message, args) {
        function myFunc() {
            return message.channel.send('repeat test');
        }

        message.channel.send('2 -- Event will start in XYZ hours. Good luck!');

        (function() {
            myFunc();

            setTimeout(arguments.callee, 10000);
        })
    },
}