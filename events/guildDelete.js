const { Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        console.log(`Just left / was kicked from the server ${guild.id}`);
        // console.log(guild);
    }
}