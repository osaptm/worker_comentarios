const { db_conexion } = require('./database/config');
const mongo = require('./models');
const { ObjectId } = require('mongoose').Types;

async function gerera_url_ciudad_x_categoria_atraccion(url_ciudad, identificador){    
    let nueva_url = url_ciudad.replace('-oa0-','-');
    nueva_url = nueva_url.replace(/(\-Activities\-)/,`$1${identificador}-`);
    return nueva_url;
}

async function paso_2(){

    try {
        // NUEVA CONEXION MONGO
        await db_conexion("127.0.0.1");
        // PRIMERO INSERTAR DETALLE ENTRE CIUDADES Y CATEGORIAS_ATRACTIVOS
        const array_ciudades = await mongo.Ciudad.find({
            $or:[
            {id_pais:new ObjectId("644546ea27536a34615427dd")}, // "Albania",     64454a8ca183601901bc99e8 
            {id_pais:new ObjectId("644546ea27536a34615427e0")}, // "Alemania",    64454acca183601901bc99e9 
            {id_pais:new ObjectId("644546ea27536a34615427e3")}, // "Andorra",     64454ae0a183601901bc99ea 
            {id_pais:new ObjectId("644546eb27536a34615427e6")}, // "Armenia",     64454af3a183601901bc99eb 
            {id_pais:new ObjectId("644546eb27536a34615427e9")}, // "Austria",     64454b08a183601901bc99ec 
            {id_pais:new ObjectId("644546eb27536a34615427ec")}, // "Azerbaiyan",  64454b1da183601901bc99ed 
            {id_pais:new ObjectId("644546ec27536a34615427ef")}, // "Belgica",     64454b2ea183601901bc99ee 
            {id_pais:new ObjectId("644546ec27536a34615427f2")}, // "Bielorrusia", 64454b42a183601901bc99ef 
            ]
        });

        console.log("Numero de ciudades : "+array_ciudades.length);
        const array_categoria_atraccion = await mongo.Categorias_atraccion.find({}); // 11 Categorias segun Tripadvisor

       for (let index = 0; index < array_ciudades.length; index++) {
            const ciudad = array_ciudades[index];
            for (let f = 0; f < array_categoria_atraccion.length; f++) {
                const categoria_atraccion = array_categoria_atraccion[f];
                const existe_detalle = await mongo.Categoria_atraccion_ciudad.findOne({id_categoira_atraccion:categoria_atraccion._id, id_ciudad:ciudad._id});
                if(existe_detalle) continue;
                const url_autogenerada = await gerera_url_ciudad_x_categoria_atraccion(ciudad.url_tripadvisor, categoria_atraccion.identificador);
                await mongo.Categoria_atraccion_ciudad.create([{id_categoira_atraccion:categoria_atraccion._id, id_ciudad:ciudad._id, url: url_autogenerada}]);                
            }    
       }

        // TENEMOS QUE OBTENER EL NUMERO DE ATRACCIONES POR CADA Categoria_atraccion_ciudad PARA GENERAR SU PAGINACION      
        process.exit();
    } catch (error) {
        console.log("FINALIZAMOS TAREAS" + error);
        process.exit();
    }

};

(async () =>{ await paso_2(); })();
