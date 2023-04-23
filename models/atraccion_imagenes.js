const { Schema, model } = require('mongoose');

const Atraccion_imagenes = Schema({ 
    id_atraccion: { type: Schema.Types.ObjectId, ref: 'Atraccion' },
    fuente :{type: String, default: ''},
    carpeta_pais: {type: String, default: ''},
    carpeta_ciudad: {type: String, default: ''},
    nombre: {type: String, default: ''},
});

module.exports = model('Atraccion_imagenes', Atraccion_imagenes);

