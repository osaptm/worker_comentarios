const { Schema, model } = require('mongoose');

const Categoria_atraccion_ciudad = Schema({ 
    id_categoira_atraccion: { type: Schema.Types.ObjectId, ref: 'Categoria_atraccion' },
    id_ciudad: { type: Schema.Types.ObjectId, ref: 'Ciudad' },
    url: {type: String, required: [true, 'Es Obligatorio']} , 
    numero_atracciones: {type: Number, default: 0 } , 
    estado_scrapeo: {
        type: String,
        required: true,
        default: 'PENDING',
        emun: ['PENDING', 'FINALIZADO']
    },
    estado_scrapeo_nro: {
        type: String,
        required: true,
        default: 'PENDING',
        emun: ['PENDING', 'IN_WORKER', 'CON_ERRORES', 'FINALIZADO','NO_TIENE', 'URL_RARA']
    },
    estado_paginacion_creada: {
        type: String,
        required: true,
        default: 'PENDING',
        emun: ['PENDING',  'FINALIZADO']
    },
    
    fecha_scrapeo_nro:{
        type: Date,
    }
});

module.exports = model('Categoria_atraccion_ciudad', Categoria_atraccion_ciudad);  