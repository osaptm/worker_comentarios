const { Schema, model } = require('mongoose');

const Categorias_atraccion = Schema({  
    nombre: {
        type: String,
        required: [true, 'Es Obligatorio']
    },
    identificador: {
        type: String,
        required: [true, 'Es Obligatorio']
    }
});

module.exports = model('Categorias_atraccion', Categorias_atraccion);  