const { Schema, model } = require('mongoose');

const Atraccion_x_categoria = Schema({ 
    id_categoria_atraccion: { type: Schema.Types.ObjectId, ref: 'Categoria_atraccion' },
    id_atraccion: { type: Schema.Types.ObjectId, ref: 'Atraccion' },
    id_categoria_atraccion_ciudad: { type: Schema.Types.ObjectId, ref: 'Categoria_atraccion_ciudad' },
    url_padre: {
        type: String,
        required: true,
        default: 'NO_NECESITA',
    }, 
});

module.exports = model('Atraccion_x_categoria', Atraccion_x_categoria);  