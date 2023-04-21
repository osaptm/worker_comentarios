const puppeteer = require('puppeteer');
const proxyChain = require('proxy-chain');
const { workerData } = require('worker_threads');
const { db_conexion } = require('../database/config'); // Base de Datoos Mongo
const mongo = require('../models');
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types; // Para usar ObjectId y comprar
require('dotenv').config();

// Variable requeridas
const proxyUrl = 'http://prueba:123@' + workerData.ip_proxy;
const tiempo_espera = 30000;

function nombre_final_sin_numeracion(nombre) {
  if(!nombre.includes('. ')) return nombre;
  const nombre_final_array = nombre.split('. ');
  const eliminar_primero = nombre_final_array.shift();
  const nombre_final = nombre_final_array.join('');
  return nombre_final;
}

async function mainWorker() {
  try {
    await db_conexion(workerData.ip_mongo);
    // Accedemos a mongo para traer pagina actual y numero
    const url = workerData.url;
    const newProxyUrl = await proxyChain.anonymizeProxy(proxyUrl);
    // Abrimos un Navegador Chromiun
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] //  `--proxy-server=${newProxyUrl}` --> Proxy Sin usar otro paquete npm
    });
    // Una nueva pagina en Navegador
    const page = await browser.newPage();
    // Accedemos a la pagina
    await page.goto(url, { waitUntil: 'load' });
    // Esoeramos por el selector unos 5 segundos    
    try {
      await page.waitForSelector(".jemSU", { timeout: tiempo_espera });
    } catch (error) {
      console.log(workerData.url);
      console.log("Error en Esperar Al Inicio -> Elemento .jemSU");
      await page.reload();
      await page.waitForSelector(".jemSU", { timeout: tiempo_espera });
    }

    await extraeAtractivos(page);

    await mongo.Pagina.updateOne({ _id: ObjectId(workerData.idpage) }, { $set: { estado_scrapeo_page: 'FINALIZADO' } });

    mongoose.connection.close();
    // Cerrar Pagina - Cerrar Navegador y Terminar Proceso NODEJS
    await page.close();
    await browser.close();
    process.exit();

  } catch (error) {

    await mongo.Pagina.updateOne({ _id: ObjectId(workerData.idpage) }, { $set: { estado_scrapeo_page: 'PENDING' } });
    console.log('ERROR EN MAIN ' + workerData.ip_proxy, error);
    mongoose.connection.close();
    await page.close();
    await browser.close();
    process.exit();

  }

}



async function extraeAtractivos(page) {
  try {

    try {
      await page.waitForSelector(".jemSU", { timeout: tiempo_espera });
    } catch (error) {
      console.log("Error en Esperar extraeAtractivos -> Elemento .jemSU");
      await page.reload();
      await page.waitForSelector(".jemSU", { timeout: tiempo_espera });
    }

    // Buscamos todos los elementos que coincidan
    const elements = await page.$$(".jemSU[data-automation='WebPresentation_SingleFlexCardSection']");
    // Recorrer todo el arreglo

    for await (let element of elements) {

      const secondDiv = await element.$('article > div:nth-of-type(2)');
      const firstH3 = await secondDiv.$('h3');
      const firstA = await secondDiv.$('a:nth-of-type(1)');
      const h3Atractivo = await (await firstH3.getProperty('textContent')).jsonValue();
      const hrefAtractivo = await (await firstA.getProperty('href')).jsonValue();

      let objAtraccion = null;
      if (hrefAtractivo.trim() !== "") {
        console.log(">>>>>" +hrefAtractivo);
        objAtraccion = await mongo.Atraccion.findOne({ url: hrefAtractivo });

      } else {
        throw "Error hrefAtractivo VACIO";
      }

      if (objAtraccion === null) {
        try {

          //console.log("---> NUEVO TODO ADGREGADO");
          const data = {
            nombre: nombre_final_sin_numeracion(h3Atractivo),
            url: hrefAtractivo,          
            id_pais: ObjectId(workerData.id_pais),
            id_ciudad: ObjectId(workerData.id_ciudad),
            id_categoria: ObjectId(workerData.id_categoria_atraccion)
          }
          const document = await mongo.Atraccion.create([data]);
          const _Atraccion_x_categoria = new mongo.Atraccion_x_categoria({
            id_categoria_atraccion: ObjectId(workerData.id_categoria_atraccion),
            id_atraccion: document[0]._id,
            id_categoria_atraccion_ciudad: ObjectId(workerData.idrecurso),
            url_padre: workerData.url,            
          });

          await _Atraccion_x_categoria.save();    

        } catch (err) {
          throw "Error guardar TODO y su detalle: " + err;
        }

      } else {
        
        const existe_Atraccion_x_categoria = await mongo.Atraccion_x_categoria.find({ 
          id_categoria_atraccion: ObjectId(workerData.id_categoria_atraccion), 
          id_atraccion: objAtraccion._id,
          id_categoria_atraccion_ciudad: ObjectId(workerData.idrecurso)
        })

          if (existe_Atraccion_x_categoria.length === 0) {

          const _Atraccion_x_categoria = new mongo.Atraccion_x_categoria({
            id_categoria_atraccion: ObjectId(workerData.id_categoria_atraccion),
            id_atraccion: objAtraccion._id,
            id_categoria_atraccion_ciudad: ObjectId(workerData.idrecurso),
            url_padre: workerData.url,
          });
          await _Atraccion_x_categoria.save();   

        }else{            

            if(workerData.url !== existe_Atraccion_x_categoria[0].url_padre){               
                const objAtraccion_repetido = await mongo.Atraccion_repetida.findOne({ 
                  id_atraccion: objAtraccion._id, 
                  url_padre:workerData.url,  
                  id_categoria_atraccion_ciudad:ObjectId(workerData.idrecurso) 
                });

                if (objAtraccion_repetido === null) {
                  await mongo.Atraccion_repetida.create([{
                    nombre: nombre_final_sin_numeracion(h3Atractivo),
                    url: hrefAtractivo,
                    url_padre: workerData.url,
                    id_atraccion:objAtraccion._id,
                    id_categoria_atraccion_ciudad: ObjectId(workerData.idrecurso)
                  }]); 
                }

            }
    
        }
        /**************************************************/
      }
    }

    console.log(`${workerData?.contador_trabajos} [[${workerData?.ip_proxy} ${workerData?.nameWorker}]] (${workerData?.numero_atracciones}/${elements.length}) ${workerData?.url}`);

  } catch (error) {

    await mongo.Pagina.updateOne({ _id: ObjectId(workerData.idpage) }, { $set: { estado_scrapeo_page: 'PENDING' } });
    console.log('Error en extraeAtractivos '+workerData?.url, error);
    process.exit();

  }
}
/************************************************************/
/************************************************************/
mainWorker();
