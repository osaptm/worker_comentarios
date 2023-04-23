const { Schema, model } = require('mongoose');

const Blog = Schema({
    nombre: {
        type: String,
        required: [true, 'Es Obligatorio']
    }, 
    url: {
        type: String,
        required: [true, 'Es Obligatorio']
    },   
    mysql: {
        type: Object,
    },   
    online: {type: Boolean, default: false } , 
});

module.exports = model('Blog', Blog);  