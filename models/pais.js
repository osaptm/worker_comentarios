const { Schema, model } = require('mongoose');

const Pais = Schema({
    nombre: {
        type: String,
        required: [true, 'Es Obligatorio']
    },    
    url_tripadvisor: {
        type: String,
        required: [true, 'Es Obligatorio']
    }
});

module.exports = model('Pais', Pais);  