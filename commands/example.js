const mysql = require('mysql2');
const { mysql_host, mysql_user, mysql_password, mysql_database } = require('../config.json');

var con = mysql.createConnection({
    host: mysql_host,
    user: mysql_user,
    password: mysql_password,
    database: mysql_database
});

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