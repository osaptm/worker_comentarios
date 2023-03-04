const axios = require('axios');
const { Worker, workerData } = require('worker_threads');
const { db_tripadvisor_x_ciudad } = require('./database/config'); // Base de Datoos Mongo
const mongo = require('./models/');
const { ObjectId } = require('mongoose').Types; // Para usar ObjectId y comprar
require('dotenv').config(); // Variables de entorno


async function workerScrape(nameWorker, proxy, page, ip_mongo) {
    try {        
        if (page === null) { main(); return; }      

        const myWorker = new Worker('./workers/_comentarios.js',
            {
                workerData: {
                    'contador_trabajos': 1,
                    'ip_proxy': proxy,
                    'ip_mongo': ip_mongo,
                    'url': page.url,
                    'idatraccion': page._id.toString(),                   
                    'nameWorker': nameWorker
                }
            });
    
        myWorker.on('exit', async (code) => {
           await main();
        });

    } catch (error) {  
        await mongo.Atraccion.updateOne({ _id: page._id }, { $set: { estado_scrapeo_comentarios: 'INWORKER' } });       
        console.log("ERROR WORKER "+error)
    }

}

const main = async () => {
    try {

        let queryMongo = `mongo.Ciudad.aggregate([
            [
                { $match: { id_pais: { $ne: ObjectId("63e1bad8b35402737fe7e9af") } } },
                { $project: { _id: 1 } },
                {
                  $lookup: {
                    from: "categoria_atraccion_ciudads",
                    localField: "_id",
                    foreignField: "id_ciudad",
                    as: "catxciu",
                  },
                },
                { $unwind: { path: "$catxciu"} },
                { $replaceRoot: { newRoot: { $mergeObjects: ["$$ROOT", "$catxciu"] } } },
                {
                  $lookup: {
                    from: "atraccion_x_categorias",
                    localField: "_id",
                    foreignField:"id_categoria_atraccion_ciudad",
                    as: "atracciones",
                  },
                },
                { $unwind: { path: "$atracciones" } },
                { $replaceRoot: { newRoot: { $mergeObjects: ["$$ROOT", "$atracciones"] } } },
                { $project: { _id: "$id_atraccion" } },
                {
                  $lookup: {
                    from: "atraccions",
                    localField: "_id",
                    foreignField: "_id",
                    as: "atraccion",
                  },
                },
                {$unwind: {path: "$atraccion"}},
                {$replaceRoot: {newRoot: {$mergeObjects: ["$$ROOT", "$atraccion"]}}},
                {$match: {estado_scrapeo_comentarios: "PENDING", $expr: {$gt: [{ $add: ["$opiniones.Excelente","$opiniones.Muy_bueno"]},20]}}},
                { $project: {_id: 1, url: 1 } }
              ]
        ]).limit(1);`;

        

        const netlify = await axios.get('https://candid-kulfi-621a88.netlify.app/');
        const configs = await netlify.data;
        
        console.log(configs);

        const consulta = await axios.post(configs.url_orquestador, { queryMongo :  queryMongo});
        const consulta_data = await consulta.data;

        const proxy = consulta_data.proxy;
        const pagina = consulta_data.pagina;

        console.log('Datos Orquestador = ', proxy, pagina);

        await db_tripadvisor_x_ciudad(configs.ip_mongo); 

        if (pagina.length !== 0)  workerScrape(` WKR `, proxy, pagina[0], configs.ip_mongo);
        else { console.log("SIN PAGINAS PARA RASPAR"); main(); }

    } catch (error) {
        console.log("ERROR INESPERADO "+error);
        process.exit();
    }

};

main();

// https://github.com/osaptm/tripadvisor
// usr/local/lsws/Example/html/node