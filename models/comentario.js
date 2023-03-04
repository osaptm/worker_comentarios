const { Schema, model } = require('mongoose');

const Comentario = Schema({
    usuario: {type: String, required: [true, 'Es Obligatorio']},
    procedencia: {type: String, default: ""},
    ranking: {type: String, default: ""},
    titulo: {type: String, default: ""},
    mensaje: {type: String, default: ""},
    id_atraccion: { type: Schema.Types.ObjectId, ref: 'Atraccion', required: [true, 'Es Obligatorio'] },
});

module.exports = model('Comentario', Comentario);  