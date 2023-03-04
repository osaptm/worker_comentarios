const mongoose = require('mongoose');
require('dotenv').config();
const OPCIONES_MONGO = process.env.OPCIONES_MONGO;
const USER_MONGO = process.env.USER_MONGO;
const PASS_MONGO = process.env.PASS_MONGO;

const db_tripadvisor_x_ciudad = async(IP_MONGO) => {
    try {
        mongoose.set('strictQuery', false);          
        mongoose.connect('mongodb://'+USER_MONGO+':'+PASS_MONGO+'@'+IP_MONGO+':27017/tripadvisor_x_ciudad'+OPCIONES_MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }); 
    } catch (error) {
        throw new Error('Error init db_tripadvisor_x_ciudad '+ error);
    }
}

module.exports = {
    db_tripadvisor_x_ciudad
}

