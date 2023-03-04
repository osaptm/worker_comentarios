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
    cantidad_scrapeado: {type: Number, default: 0}  
});

module.exports = model('Atraccion', Atraccion);  