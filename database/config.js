const mongoose = require('mongoose');
require('dotenv').config();
const OPCIONES_MONGO = "?directConnection=true&authMechanism=DEFAULT&authSource=admin&replicaSet=rs0&w=majority";
const db_conexion = async(IP_MONGO) => {
    try {
        mongoose.set('strictQuery', false);          
        mongoose.connect('mongodb://osaptm:123@'+IP_MONGO+':27017/tripadvisor_x_ciudad'+OPCIONES_MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }); 
    } catch (error) {
        throw new Error('Error init db_conexion '+ error);
    }
}

module.exports = {
    db_conexion
}

