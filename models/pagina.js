const { Schema, model } = require('mongoose');

const Pagina = Schema({
    url_actual: {
        type: String,
        required: [true, 'Es Obligatorio']
    },    
    numero_actual: {
        type: Number,
        default: 1,
        required: [true, 'Es Obligatorio']
    },     
    estado_scrapeo_page: {
        type: String,
        required: true,
        default: 'PENDING',
        emun: ['PENDING', 'INWORKER', 'FINALIZADO']
    }, 
    id_categoria_atraccion_ciudad: { 
        type: Schema.Types.ObjectId ,
        required: [true, 'Es Obligatorio'],
    },
});

module.exports = model('Pagina', Pagina);  