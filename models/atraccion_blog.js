const { Schema, model } = require('mongoose');

const Atraccion_blog = Schema({ 
    id_blog: { type: Schema.Types.ObjectId, ref: 'Blog' },
    id_atraccion: { type: Schema.Types.ObjectId, ref: 'Atraccion' },
    id_ciudad: { type: Schema.Types.ObjectId, ref: 'Ciudad' },
});

module.exports = model('Atraccion_blog', Atraccion_blog);

