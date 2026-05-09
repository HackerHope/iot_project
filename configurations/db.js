const mysql = require('mysql')

const pool = mysql.pool({
    host: 'localhost',
    user: 'root',
    password: 'kevin10King11',
    waitForConnections : true,


})