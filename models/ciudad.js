const { Schema, model } = require('mongoose');

const Ciudad = Schema({
    nombre: {
        type: String,
        required: [true, 'Es Obligatorio']
    },    
    url_tripadvisor: {
        type: String,
        required: [true, 'Es Obligatorio']
    },    
    estado_scrapeo: {
        type: String,
        required: true,
        default: 'PENDING',
        emun: ['PENDING', 'FINALIZADO']
    },     
    atracciones_to_scrape:{
        type: Number,
        default:0,
        required: [true, 'Es Obligatorio'],
    },
    estado_publicar_automatico:{
        type: Boolean,
        default:false,       
    },
    geo_latitude: {
        type: String,
        default: '',
    },    
    geo_longitude: {
        type: String,
        default: '',
    },    
    id_pais: { type: Schema.Types.ObjectId, ref: 'Pais' }
});

module.exports = model('Ciudad', Ciudad);  