const { Schema, model } = require('mongoose');

const Atraccion_repetida = Schema({
    nombre: {
        type: String,
        required: [true, 'Es Obligatorio']
    },    
    url: {
        type: String,
        required: [true, 'Es Obligatorio']
    },     
    url_padre: {
        type: String,
        required: [true, 'Es Obligatorio']
    },
    id_atraccion: { type: Schema.Types.ObjectId, ref: 'Atraccion' , required: [true, 'Es Obligatorio']},
    id_categoria_atraccion_ciudad: { type: Schema.Types.ObjectId, ref: 'Categoria_atraccion_ciudad' , required: [true, 'Es Obligatorio']},
});

module.exports = model('Atraccion_repetida', Atraccion_repetida);  