const { exec } = require('child_process');
const os = require("os");
const axios = require('axios');
const { Worker, workerData } = require('worker_threads');
const { db_tripadvisor_x_ciudad } = require('./database/config'); // Base de Datoos Mongo
const mongo = require('./models/');
const { ObjectId } = require('mongoose').Types; // Para usar ObjectId y comprar
require('dotenv').config(); // Variables de entorno
var contador_workers_finalizados  = 0;
var numero_workers = 1;

function kill_chrome(){
  if(contador_workers_finalizados === numero_workers){           
    if (os.platform() === "win32") {
      console.log("Matamos Chrome en Windows")
      exec("Taskkill /F /IM chrome.exe", (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error matar chrome windows: ${error}`);
          process.exit(); 
        }
        console.log(`Matamos Chrome windows stdout: ${stdout}`);
        console.log(`Matamos Chrome windows stderr: ${stderr}`);
        process.exit(); 
      });     
    } else {
        exec('sudo killall -9 chrome && sudo sync && sudo echo 3 > /proc/sys/vm/drop_caches', (err, stdout, stderr) => {
        if (err) { console.error("Error al Matar Chrome Linux" + err); process.exit(); }
        console.log("Matamos Chrome Linux OK" + stdout);
        process.exit();            
      });
    }            
  }
}
async function workerScrape(nameWorker, proxy, page, ip_mongo) {
    try {        
        if (page === null) { main(); return; }      

        await mongo.Comentario.deleteMany({ id_atraccion: page._id });
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
          console.log("FINALIZA WORKER ")
          contador_workers_finalizados++;
        });

    } catch (error) {  
        await mongo.Atraccion.updateOne({ _id: page._id }, { $set: { estado_scrapeo_comentarios: 'INWORKER' } });       
        console.log("ERROR WORKER "+error);
        contador_workers_finalizados++;
    }

}

const main = async () => {
    try {

        // let queryMongo_ = `mongo.Ciudad.aggregate([
        //     [
        //         { $match: { id_pais: { $ne: ObjectId("63e1bad8b35402737fe7e9af") } } },
        //         { $project: { _id: 1 } },
        //         {
        //           $lookup: {
        //             from: "categoria_atraccion_ciudads",
        //             localField: "_id",
        //             foreignField: "id_ciudad",
        //             as: "catxciu",
        //           },
        //         },
        //         { $unwind: { path: "$catxciu"} },
        //         { $replaceRoot: { newRoot: { $mergeObjects: ["$$ROOT", "$catxciu"] } } },
        //         {
        //           $lookup: {
        //             from: "atraccion_x_categorias",
        //             localField: "_id",
        //             foreignField:"id_categoria_atraccion_ciudad",
        //             as: "atracciones",
        //           },
        //         },
        //         { $unwind: { path: "$atracciones" } },
        //         { $replaceRoot: { newRoot: { $mergeObjects: ["$$ROOT", "$atracciones"] } } },
        //         { $project: { _id: "$id_atraccion" } },
        //         {
        //           $lookup: {
        //             from: "atraccions",
        //             localField: "_id",
        //             foreignField: "_id",
        //             as: "atraccion",
        //           },
        //         },
        //         {$unwind: {path: "$atraccion"}},
        //         {$replaceRoot: {newRoot: {$mergeObjects: ["$$ROOT", "$atraccion"]}}},
        //         {$match:{
        //           $or:[{"estado_scrapeo_comentarios": "XXXX"},{"estado_scrapeo_comentarios": "PENDING"}], 
        //           $expr: {$gt: [{ $add: ["$opiniones.Excelente","$opiniones.Muy_bueno"]}, 20]}
        //         }},
        //         { $project: {_id: 1, url: 1 } }
        //       ]
        // ]).limit(1);`;

       
        let queryMongo = `mongo.Atraccion.aggregate([
          {$match:{
            $or:[{"estado_scrapeo_comentarios": "XXXX"},{"estado_scrapeo_comentarios": "PENDING"}], 
            $expr: {$gt: [{ $add: ["$opiniones.Excelente","$opiniones.Muy_bueno"]}, 15]}
          }},
          { $project: {_id: 1, url: 1 } }
        ]).limit(1);`
        

        const netlify = await axios.get('https://candid-kulfi-621a88.netlify.app/');
        const configs = await netlify.data;
        
        console.log('Datos Netlify = ' , configs.url_orquestador, configs.ip_mongo);
        await db_tripadvisor_x_ciudad(configs.ip_mongo);

        // await mongo.Atraccion.updateMany({estado_scrapeo_comentarios:'INWORKER'},{$set:{ estado_scrapeo_comentarios: 'PENDING' }});
        // await mongo.Atraccion.updateMany({estado_scrapeo_comentarios:'ERROR'},{$set:{ estado_scrapeo_comentarios: 'PENDING' }});

        for (let index = 0; index < numero_workers; index++) {
          
              const consulta = await axios.post(configs.url_orquestador, { queryMongo :  queryMongo, coleccion:'Atraccion'});
              const consulta_data = await consulta.data;

              const proxy = consulta_data.proxy;
              const pagina = consulta_data.pagina;
              const error = consulta_data.error;

              if( error === null ){          
               
                
                if (pagina.length !== 0) {
                  console.log('Iniciar Worker = ', proxy, pagina[0]?.url);
                  workerScrape(` WKR `, proxy, pagina[0], configs.ip_mongo);
                } else { console.log("SIN PAGINAS PARA RASPAR"); main(); }

              }else{
                console.log("ERROR DEL ORQUESTADOR " + error); main(); 
              }
          
        }

        setInterval(() => kill_chrome() , 5000);

    } catch (error) {
         console.log("ERROR INESPERADO "+error);
         setInterval(() => kill_chrome() , 5000);
    }
};

main();
// Taskkill /F /IM chrome.exe
// killall -9 chrome
// https://github.com/osaptm/worker_comentarios
// https://github.com/osaptm/tripadvisor
// usr/local/lsws/Example/html/node