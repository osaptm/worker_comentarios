const { exec } = require('child_process');
const os = require("os");
const axios = require('axios');
const { Worker, workerData } = require('worker_threads');
const { db_conexion } = require('./database/config'); // Base de Datoos Mongo
const mongo = require('./models');
const { ObjectId } = require('mongoose').Types; // Para usar ObjectId y comprar
require('dotenv').config(); // Variables de entorno

const main = async () => {
    try {     
        await db_conexion("127.0.0.1");
        const ciudades = await mongo.Ciudad.find({});
        console.log(">>>>>>>>>>>",ciudades.length);      

    } catch (error) {
         console.log("ERROR INESPERADO "+error);
         process.exit();
    }
};
main();
