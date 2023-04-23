const { Schema, model } = require('mongoose');

const Atraccion_blog = Schema({ 
    id_blog: { type: Schema.Types.ObjectId, ref: 'Blog' },
    id_atraccion: { type: Schema.Types.ObjectId, ref: 'Atraccion' },
    id_ciudad: { type: Schema.Types.ObjectId, ref: 'Ciudad' },
    title    : {type: String, default: '' }, 
    url: {type: String, default: '' }, 
    mysql_id_category :  {type: Number, default: 0 },
    arr_video: {type: Array,  default: []}, 
    arr_fotos: {type: Array,  default: []}, 
    ia_descripcion    : {type: String, default: '' }, 
    ia_recomendaciones: {type: String, default: '' }, 
    recomendaciones_retocadas: {type: String, default: '' }, 
    tiempo_distancia_html   : {type: String, default: '' }, 
    distancia_metros  : {type: String, default: '' }, 
    duracion_segundos : {type: String, default: '' }, 
    coordenadas       : {type: Object,  default:{}}, 
    error       : {type: Boolean,  default: false}, 
    mysql_id_post: {type: Number, default: 0 }, 
   
});

module.exports = model('Atraccion_blog', Atraccion_blog);

