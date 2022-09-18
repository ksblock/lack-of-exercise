const mysql = require('mysql2/promise');
const db_config = require('./db_config.json');

var conn = mysql.createPool({
    host : db_config.host,
    user : db_config.username,
    password : db_config.password,
    database : db_config.database,
    multipleStatements: true,
    connectionLimit: 10,
    timezone: "+09:00"
});

//conn.connect();

module.exports = conn;