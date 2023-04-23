const { Schema, model } = require('mongoose');

const Ciudad_blog = Schema({ 
    id_blog: { type: Schema.Types.ObjectId, ref: 'Blog' },
    id_ciudad: { type: Schema.Types.ObjectId, ref: 'Ciudad' },
    id_pais: { type: Schema.Types.ObjectId, ref: 'Pais' },
    id_pais_blog: { type: Schema.Types.ObjectId, ref: 'Pais_blog' },
    mysql_id_category: {type: Number, default: 0 } , 
});

module.exports = model('Ciudad_blog', Ciudad_blog);