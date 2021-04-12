const mysql = require('mysql2');
const { con } = require('../index.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`----------------------------\nEventBot is running! Logged in as ${client.user.tag}`);

        con.connect(err => {
            if (err) throw err;
        });

        console.log("Connected to MySQL database!\n----------------------------");
    },
};