const puppeteer = require('puppeteer');
const proxyChain = require('proxy-chain');
const { workerData } = require('worker_threads');
const { db_conexion } = require('../database/config'); // Base de Datoos Mongo
const mongo = require('../models');
const { ObjectId } = require('mongoose').Types; // Para usar ObjectId y comprar
require('dotenv').config();

// Variable requeridas
const proxyUrl = 'http://prueba:123@' + workerData.ip_proxy;
const tiempo_espera = 5000;


async function mainWorker() {
  try {
    await db_conexion(workerData.ip_mongo);
    // Accedemos a mongo para traer pagina actual y numero
    const url = workerData.url;

    if(workerData.url.includes('Tourism')){
      console.log(`${workerData.contador_trabajos} ->  ${workerData.nameWorker} - ${firstNumber} - ${url}`);     
      await mongo.Categoria_atraccion_ciudad.updateOne({ _id: ObjectId(workerData.iddetalle) }, { $set: { estado_scrapeo_nro: 'URL_RARA' } }); 
      process.exit();
    }

    const newProxyUrl = await proxyChain.anonymizeProxy(proxyUrl);
    // Abrimos un Navegador Chromiun
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] //  `--proxy-server=${newProxyUrl}` --> Proxy Sin usar otro paquete npm
    });
    // Una nueva pagina en Navegador
    const page = await browser.newPage();
    // Accedemos a la pagina
    await page.goto(url);
    // Esoeramos por el selector unos 2 segundos para saber si hay informacion
    const ninguna_atraccion = await page.$(".Igubo");   

    if(ninguna_atraccion) {
      let title_ninguna_atraccion =  await (await ninguna_atraccion.getProperty('textContent')).jsonValue();
      if(title_ninguna_atraccion.includes('Ninguna atracción') || title_ninguna_atraccion.includes('ninguna atracción') || title_ninguna_atraccion.includes('Prueba otros filtros')){
        console.log(`${workerData.contador_trabajos} ->  ${workerData.nameWorker} - [ 0 ] - ${url}`);
        const fechaActual = new Date();
     await mongo.Categoria_atraccion_ciudad.updateOne({ _id: ObjectId(workerData.iddetalle) }, 
     { 
      $set: { 
        numero_atracciones: 0,
        estado_scrapeo_nro: 'NO_TIENE',
        fecha_scrapeo_nro : fechaActual,
        } 
      });
        process.exit();
      }
    }


    let data_automation = '';
    try {
      data_automation = 'WebPresentation_WebSortDisclaimer';
      await page.waitForSelector(".jemSU[data-automation='WebPresentation_WebSortDisclaimer']", { timeout: tiempo_espera });
      
    } catch (error) {
      console.log("Error en Esperar Al Inicio [1] -> WebPresentation_WebSortDisclaimer ");
      try {
     
        await page.reload();
        data_automation = 'WebPresentation_WebSortDisclaimer';
        await page.waitForSelector(".jemSU[data-automation='WebPresentation_WebSortDisclaimer']", { timeout: tiempo_espera });
        
      } catch (error) {

        console.log("Error en Esperar Al Inicio [2] -> WebPresentation_WebSortDisclaimer ");
        data_automation = 'WebPresentation_OverFilteredSection';
        await page.waitForSelector(".jemSU[data-automation='WebPresentation_OverFilteredSection']", { timeout: tiempo_espera });
        
      }
    }

    const elemento = await page.$(".jemSU[data-automation='"+data_automation+"']")
    const info = await elemento.$(".biGQs");
    let title_ =  await (await info.getProperty('textContent')).jsonValue();
    title_ = title_.replaceAll(",","");
    let firstNumber = 0;
    if(title_.includes("Más de")){
      const elemento_paginacion = await page.$(".jemSU[data-automation='WebPresentation_PaginationLinksList']")
      const infoPaginas = await elemento_paginacion.$(".uYzlj > .biGQs");
      title_ =  await (await infoPaginas.getProperty('textContent')).jsonValue();
      title_ = title_.replaceAll(",","");
      const separa  = title_.split("de");
      firstNumber = Number(separa[2]);
    }else{
      firstNumber = Number(title_.match(/\d+/)[0]);
    }   
        
     console.log(`${workerData.contador_trabajos} ->  ${workerData.nameWorker} - ${firstNumber} - ${url}`);     
     let estado_final = 'NO_TIENE';
     if(firstNumber === 0 || firstNumber === NaN){ firstNumber = 0; estado_final='NO_TIENE';}
     else{estado_final='FINALIZADO'; }

     const fechaActual = new Date();
     await mongo.Categoria_atraccion_ciudad.updateOne({ _id: ObjectId(workerData.iddetalle) }, 
     { 
      $set: { 
        numero_atracciones: firstNumber,
        estado_scrapeo_nro: estado_final,
        fecha_scrapeo_nro : fechaActual,
        } 
      });

     
     

    await page.close();
    await browser.close();
    process.exit();

  } catch (error) {
    const fechaActual = new Date();
    await mongo.Categoria_atraccion_ciudad.updateOne({ _id: ObjectId(workerData.iddetalle) }, 
    { 
     $set: { 
       numero_atracciones: 0,
       estado_scrapeo_nro: 'CON_ERRORES',
       fecha_scrapeo_nro : fechaActual,
       } 
     });
    console.log('ERROR EN MAIN '+workerData.ip_proxy, workerData.url, error);
    process.exit();
  } 

}
/************************************************************/
/************************************************************/
mainWorker();
