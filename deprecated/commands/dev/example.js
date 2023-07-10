const mysql = require('mysql2');
const config = require('../../config.json');
const { con } = require('../../index.js');

// var con = mysql.createConnection({
//     host: config.mysql_host,
//     user: config.mysql_user,
//     password: config.mysql_password,
//     database: config.mysql_database
// });

module.exports = {
    name: 'example',
    description: '',
    aliases: [''],
    guildOnly: true,
    args: false,
    usage: '<>',
    cooldown: 3,
    execute(message, args) {
        // Do something here.
    },
}