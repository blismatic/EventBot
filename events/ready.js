const mysql = require('mysql2');
const config = require('../config.json');

var con = mysql.createConnection({
    host: config.mysql_host,
    user: config.mysql_user,
    password: config.mysql_password,
    database: config.mysql_database
});

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        //console.log('Ready!');
        console.log(`----------------------------\nEventBot is running! Logged in as ${client.user.tag}`);

        con.connect(err => {
            if (err) throw err;
        });

        console.log("Connected to MySQL database!\n----------------------------");
    },
};