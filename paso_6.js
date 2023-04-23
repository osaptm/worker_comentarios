const { db_conexion } = require('./database/config'); // Base de Datoos Mongo
const mongo = require('./models');
const { ObjectId } = require('mongoose').Types; // Para usar ObjectId y comprar
require('dotenv').config(); // Variables de entorno

const paso_6 = async () => {
    
    await db_conexion("127.0.0.1");
    const consulta = await mongo.Categoria_atraccion_ciudad.aggregate([
        {
          $lookup: {
            from: "ciudads",
            localField: "id_ciudad",
            foreignField: "_id",
            as: "ciudades",
          },
        },
        {
          $unwind: {
            path: "$ciudades",
          },
        },
        {
          $project: {
            _id: 1,
            id_ciudad: 1,
            url: 1,
            estado_scrapeo_nro: 1,
            id_pais: "$ciudades.id_pais",
          },
        },
        {
          $match:           
            {
              $or:[
                {id_pais:new ObjectId("644546ea27536a34615427dd")}, // "Albania",     64454a8ca183601901bc99e8 
                {id_pais:new ObjectId("644546ea27536a34615427e0")}, // "Alemania",    64454acca183601901bc99e9 
                {id_pais:new ObjectId("644546ea27536a34615427e3")}, // "Andorra",     64454ae0a183601901bc99ea 
                {id_pais:new ObjectId("644546eb27536a34615427e6")}, // "Armenia",     64454af3a183601901bc99eb 
                {id_pais:new ObjectId("644546eb27536a34615427e9")}, // "Austria",     64454b08a183601901bc99ec 
                {id_pais:new ObjectId("644546eb27536a34615427ec")}, // "Azerbaiyan",  64454b1da183601901bc99ed 
                {id_pais:new ObjectId("644546ec27536a34615427ef")}, // "Belgica",     64454b2ea183601901bc99ee 
                {id_pais:new ObjectId("644546ec27536a34615427f2")}, // "Bielorrusia", 64454b42a183601901bc99ef                   
            ],
            },
        },
      ]);
      
      console.log("Total a Verificar = "+consulta.length);

    if (consulta.length !== 0) {
        for (let index = 0; index < consulta.length; index++) {
            const todos = await mongo.Atraccion_x_categoria.find({ id_categoria_atraccion_ciudad: consulta[index]._id }); 
            const repetidos = await mongo.Atraccion_repetida.find({ id_categoria_atraccion_ciudad: consulta[index]._id });           
            const cantidad_esperada = consulta[index].numero_atracciones;
            const total_mas_repetidos = todos.length + repetidos.length;
            const resta = cantidad_esperada - total_mas_repetidos;
            if(cantidad_esperada !== total_mas_repetidos){
                if ( resta >= 1 || resta <= -1) {
                    await mongo.Pagina.updateMany({id_categoria_atraccion_ciudad : consulta[index]._id},{$set:{estado_scrapeo_page:'PENDING'}});
                    console.log(consulta[index]._id + ` ${cantidad_esperada} / ${total_mas_repetidos} = ${todos.length} + ${repetidos.length}`);
                    console.log(consulta[index].url)
                }
            }
        }
    }
    console.log("Fin tarea");
    process.exit();
}

(async () =>{ await paso_6(); })();

