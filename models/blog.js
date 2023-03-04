const { Schema, model } = require('mongoose');

const Blog = Schema({
    nombre: {
        type: String,
        required: [true, 'Es Obligatorio']
    }   
});

module.exports = model('Blog', Blog);  