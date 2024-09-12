import fs from 'fs';
import mysql2 from 'mysql2';

import dotenv from "dotenv";

dotenv.config({path: './config.env'});

const sslCert = fs.readFileSync('./utils/ca.pem');

// const con = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "employees",
//     port: 3307
// })


const con = mysql2.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME,
    port: process.env.DBPORT,
    ssl: {
        ca: sslCert
    }
})

con.connect(function(err) {
    if(err) {
        console.log(err)
        console.log("connection error")
    } else {
        console.log("Connected")
    }
})

export default con;

