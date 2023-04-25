const { db_conexion } = require('./database/config');
const mongo = require('./models');
const { ObjectId } = require('mongoose').Types;

async function paso_2(){

    try {
        // NUEVA CONEXION MONGO
        await db_conexion();
        // PRIMERO INSERTAR DETALLE ENTRE CIUDADES Y CATEGORIAS_ATRACTIVOS
        const array_ciudades = await mongo.Ciudad.aggregate([
            {
                $lookup: {
                  from: "categoria_atraccion_ciudads",
                  localField: "_id",
                  foreignField: "id_ciudad",
                  as: "categorias",
                },
            },
            {
                $project: {
                  _id: "$_id",
                  url_tripadvisor : "$url_tripadvisor",
                  total_cate: {$size: "$categorias"},                  
                },
              },
              {
                $match: {
                    total_cate: {$lt: 11},              
                },
              },
        ]);

        console.log("Numero de ciudades : "+array_ciudades.length);
        const array_categoria_atraccion = await mongo.Categorias_atraccion.find({}); // 11 Categorias segun Tripadvisor

       for (let index = 0; index < array_ciudades.length; index++) {
            const ciudad = array_ciudades[index];
            for (let f = 0; f < array_categoria_atraccion.length; f++) {
                const categoria_atraccion = array_categoria_atraccion[f];
                const existe_detalle = await mongo.Categoria_atraccion_ciudad.findOne({id_categoira_atraccion:categoria_atraccion._id, id_ciudad:ciudad._id});
                if(existe_detalle) {
                    continue;
                }
                console.log(ciudad.url_tripadvisor);
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
