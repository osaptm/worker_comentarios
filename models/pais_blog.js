const { Schema, model } = require('mongoose');

const Pais_blog = Schema({ 
    id_blog: { type: Schema.Types.ObjectId, ref: 'Blog' },
    id_pais: { type: Schema.Types.ObjectId, ref: 'Pais' },
});

module.exports = model('Pais_blog', Pais_blog);