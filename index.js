const { exec } = require('child_process');
const os = require("os");
const axios = require('axios');
const { Worker, workerData } = require('worker_threads');
const { db_conexion } = require('./database/config'); // Base de Datoos Mongo
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

async function workerScrape_paso_8(nameWorker, proxy, page, ip_mongo) {
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

async function workerScrape_paso_3(nameWorker, proxy, page, ip_mongo) {
  try { 
      let obj_detalle = page;
      if (obj_detalle === null) { return; }

      await mongo.Categoria_atraccion_ciudad.updateOne({ _id: obj_detalle._id }, { $set: { estado_scrapeo_nro: 'INWORKER' } });    
      const myWorker = new Worker('./workers/worker_scrape_nro_atracciones.js',
          {
              workerData: {
                  'contador_trabajos': 1,
                  'ip_proxy': proxy,
                  'ip_mongo': ip_mongo,
                  'url': obj_detalle.url,
                  'iddetalle': obj_detalle._id.toString(),
                  'nameWorker': nameWorker
              }
          });
      myWorker.on('exit', async (code) => {
          console.log("FINALIZA WORKER ")
          contador_workers_finalizados++;
      });
  } catch (error) {  
    await mongo.Categoria_atraccion_ciudad.updateOne({ _id: page._id}, { $set: { estado_scrapeo_nro: 'INWORKER' } });     
    console.log("ERROR WORKER "+error);
    contador_workers_finalizados++;
  }
}

async function workerScrape_paso_5(nameWorker, proxy, page, ip_mongo) {
  try {      
      if (page === null) { return;}  
      await mongo.Pagina.updateOne({ _id: page._id }, { $set: { estado_scrapeo_page: 'INWORKER' } }); 
      const Categoria_atraccion_ciudad = await mongo.Categoria_atraccion_ciudad.findOne({ _id: page._id });
      if (Categoria_atraccion_ciudad === null) { return; }
      const Ciudad = await mongo.Ciudad.findOne({_id : Categoria_atraccion_ciudad.id_ciudad});
  
      const myWorker = new Worker('./workers/worker_scrape_atracciones_by_page.js',
          {
              workerData: {
                  'contador_trabajos': 1,
                  'ip_proxy': proxy,
                  'ip_mongo': ip_mongo,
                  'url': page.paginas.url_actual,
                  'idpage': page.paginas._id.toString(),                    
                  'numero_atracciones': Categoria_atraccion_ciudad.numero_atracciones,
                  'id_pais': Ciudad.id_pais.toString(),
                  'id_ciudad': Categoria_atraccion_ciudad.id_ciudad.toString(),
                  'id_categoria_atraccion': Categoria_atraccion_ciudad.id_categoira_atraccion.toString(),
                  'idrecurso': Categoria_atraccion_ciudad._id.toString(),
                  'nameWorker': nameWorker
              }
          });
  
      myWorker.on('exit', async (code) => {           
        console.log("FINALIZA WORKER ")
        contador_workers_finalizados++;
      });

  } catch (error) {         
    await mongo.Pagina.updateOne({ _id: page._id }, { $set: { estado_scrapeo_page: 'INWORKER' } });  
    console.log("ERROR WORKER "+error);
    contador_workers_finalizados++;
  }

}


async function workerScrape_paso_7(nameWorker, proxy, page, ip_mongo) {
  try {      
      if (page === null) {return;}  
      await mongo.Atraccion.updateOne({ _id: page._id }, { $set: { estado_scrapeo: 'INWORKER' } });
      const myWorker = new Worker('./workers/_atractivos.js',
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
    await mongo.Atraccion.updateOne({ _id: page._id }, { $set: { estado_scrapeo: 'INWORKER' } });
    console.log("ERROR WORKER "+error);
    contador_workers_finalizados++;
  }

}


const main = async () => {
    try {      
                
       const netlify = await axios.get('https://candid-kulfi-621a88.netlify.app/');
       const configs = await netlify.data;
       //const configs = {ip_mongo:"34.135.177.38", url_orquestador:"http://127.0.0.1:3000/orquestador/"}
        
        console.log('Datos Netlify = ' , configs.url_orquestador, configs.ip_mongo);
        await db_conexion(configs.ip_mongo);

        // await mongo.Atraccion.updateMany({estado_scrapeo_comentarios:'INWORKER'},{$set:{ estado_scrapeo_comentarios: 'PENDING' }});
        // await mongo.Atraccion.updateMany({estado_scrapeo_comentarios:'ERROR'},{$set:{ estado_scrapeo_comentarios: 'PENDING' }});

        for (let index = 0; index < numero_workers; index++) {
          
              const consulta = await axios.post(configs.url_orquestador, { pideTrabajo :  true});
              const consulta_data = await consulta.data;

              const proxy = consulta_data.proxy;
              const pagina = consulta_data.pagina;
              const tipoTrabajo = consulta_data.tipoTrabajo;
              const error = consulta_data.error;

              if( error === null ){        
                  if (pagina.length !== 0) {
                    console.log('Iniciar Worker = ', tipoTrabajo, pagina[0]?.url);                    
                    if(tipoTrabajo === 'paso_3') workerScrape_paso_3(` WKR `, proxy, pagina[0], configs.ip_mongo);
                    if(tipoTrabajo === 'paso_5') workerScrape_paso_5(` WKR `, proxy, pagina[0], configs.ip_mongo);
                    if(tipoTrabajo === 'paso_7') workerScrape_paso_7(` WKR `, proxy, pagina[0], configs.ip_mongo);
                    if(tipoTrabajo === 'paso_8') workerScrape_paso_8(` WKR `, proxy, pagina[0], configs.ip_mongo);
                  } else { 
                    contador_workers_finalizados++; console.log("SIN PAGINAS PARA RASPAR"); kill_chrome() 
                  }
              }else{
                contador_workers_finalizados++; console.log("ERROR DEL ORQUESTADOR " + error); kill_chrome(); 
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
// pkill -f node