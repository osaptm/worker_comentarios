const { Schema, model } = require('mongoose');

const Atraccion = Schema({
    nombre: {
        type: String,
        required: [true, 'Es Obligatorio']
    },    
    url: {
        type: String,
        required: [true, 'Es Obligatorio']
    },   
    estado_scrapeo: {
        type: String,
        required: true,
        default: 'PENDING',
        emun: ['PENDING', 'INWORKER','FINALIZADO']
    },
    estado_scrapeo_comentarios: {
        type: String,
        required: true,
        default: 'PENDING',
        emun: ['PENDING', 'INWORKER','FINALIZADO','ERROR']
    },
    h1_page: { type: String},  
    breadcrumbs: { type: Object}, 
    categorias_reviews: { type: Object},  
    acerca: {type: Object},  
    fotos: {type: Object},  
    disfrutar: {type: Object},  
    location: {type: Object},  
    opiniones: {type: Object}, 
    cantidad_scrapeado: {type: Number, default: 0},  
    id_pais: { type: Schema.Types.ObjectId, ref: 'Pais' },
    id_ciudad: { type: Schema.Types.ObjectId, ref: 'Ciudad' },
    id_categoria: { type: Schema.Types.ObjectId, ref: 'Categorias_atraccion' },
    arr_videos: {type: Array,  default:[]}, 
    distancia_tiempo: {type: Object, default:{}},   
    estado_paso_10: {
        type: String,
        default: 'PENDING',
        emun: ['PENDING', 'INWORKER','FINALIZADO']
    },
    estado_fotos_faltantes: {
        type: String,
        default: 'PENDING',
        emun: ['PENDING', 'INWORKER','FINALIZADO']
    },
    estado_publicacion: {
        type: String,
        default: 'PENDING',
        emun: ['PENDING', 'INWORKER','FINALIZADO']
    },
});

module.exports = model('Atraccion', Atraccion);  