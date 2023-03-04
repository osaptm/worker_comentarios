const { db_tripadvisor_x_ciudad } = require('../database/config'); // Base de Datoos Mongo
const mongo = require('../models/');
const { workerData } = require('worker_threads');
const { ObjectId } = require('mongoose').Types;
require('dotenv').config();
// ********* Para Scrapeo *********** //
const puppeteer = require('puppeteer');
const proxyChain = require('proxy-chain');
// ********* Para Scrapeo *********** //

// ************* Variable requeridas ************* //
const proxyUrl = 'http://prueba:123@' + workerData.ip_proxy;
const tiempo_espera = 30000;
var paginacion_comentarios = 1;
var comentarios_grabados = 0;
// ************* Variable requeridas ************* //
async function guardar_comentarios(array_comentarios) {
  for (const comentario of array_comentarios) {

    let txt_usuario = ""; let txt_procedencia = ""; 
    let txt_ranking = ""; let txt_titulo = "";
    let txt_mensaje = "";

    const usuario = await comentario.$('.mwPje >.XExLl > .zpDvc > span');
    if (usuario) {
      txt_usuario = await (await usuario.getProperty('textContent')).jsonValue();
      const procedencia = await comentario.$('.mwPje > .XExLl > .zpDvc > .JINyA');
      
      if(procedencia) txt_procedencia = await (await procedencia.getProperty('textContent')).jsonValue();
      const ranking = await comentario.$('div > svg');
      
      if(ranking) {
        txt_ranking = await ranking.evaluate(el => el.getAttribute('aria-label'));
        txt_ranking = txt_ranking.replace("burbujas.","");
        txt_ranking = txt_ranking.replace("burbujas","");
        txt_ranking = txt_ranking.trim();
      }
      const titulo = await comentario.$('.biGQs > a');
      
      if(titulo) txt_titulo = await (await titulo.getProperty('textContent')).jsonValue();
      const mensaje = await comentario.$('._T >.fIrGe > .biGQs > span');
      
      if(mensaje) txt_mensaje = await (await mensaje.getProperty('textContent')).jsonValue();

      if(txt_mensaje.length > 0){
        await mongo.Comentario.create([{
          usuario: txt_usuario,
          procedencia: txt_procedencia,
          ranking: txt_ranking,
          titulo: txt_titulo,
          mensaje: txt_mensaje,
          id_atraccion: workerData.idatraccion,
        }]);
        comentarios_grabados++;
      }

    }

  }
}

async function trae_comentarios(page) {
  const comentarios = await page.$('#tab-data-qa-reviews-0 > .eSDnY > .LbPSX');
  if (comentarios) {
    console.log("Existen Comentarios")
    console.log(`-----> COMENTARIOS - ${workerData.url}`)
    const array_comentarios = await comentarios.$$("div[data-automation='reviewCard']");
    console.log(`Total comentarios x page[${paginacion_comentarios}] = `, array_comentarios.length);

    if(array_comentarios.length > 0){
      await guardar_comentarios(array_comentarios);
    }else{
      console.log(`-----> RAROOOOOO - ${workerData.url}`)
    }

    const paginacion = await comentarios.$('div > .uYzlj > .lATJZ > .tgunb > .gBgtO');
    if (paginacion) {
      console.log("Existe Paginacion")
      const datos_paginacion = await comentarios.$('div > .uYzlj > .biGQs');
      const title_ = await (await datos_paginacion.getProperty('textContent')).jsonValue();
      console.log(title_)

      const numeracionPaginacion = await paginacion.$$(".nsTKv > a");
      for (let elementoEnlace of numeracionPaginacion) {
        const nro_pagina = await (await elementoEnlace.getProperty('textContent')).jsonValue();
        if (Number(nro_pagina) === paginacion_comentarios + 1) {
          console.log("Existe PAGINA NRO " + nro_pagina )
          paginacion_comentarios++;
          return elementoEnlace;
        }
      }
      return null;
    }else{
      console.log(`-----> SIN PAGINACION - ${workerData.url}`)
      return null;
    } 

  }else{
    console.log(`-----> SIN COMENTARIOS - ${workerData.url}`)
    return null;
  }
}
// ****************************************** MAIN  ******************************************** //
(async () => {
  try {    
    await db_tripadvisor_x_ciudad(workerData.ip_mongo);
    const url = workerData.url;
    const newProxyUrl = await proxyChain.anonymizeProxy(proxyUrl);
    // Abrimos un Navegador Chromiun
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox',
        '--disable-setuid-sandbox',
        `--proxy-server=${newProxyUrl}`,         
        ] //  `--proxy-server=${newProxyUrl}` --> Proxy Sin usar otro paquete npm  `--proxy-server=${newProxyUrl}`,    '--window-size=1920,1080'
    });
    // Una nueva pagina en Navegador
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.resourceType() === 'image' || request.resourceType() === 'media') {
        request.abort();
      } else {
        request.continue();
      }
    });
    //await page.setViewport({ width: 1900, height: 1000 });
    // Accedemos a la pagina
    await page.goto(url, { waitUntil: 'domcontentloaded' });


    //Esoeramos por los comentarios -> si no aparece recargamos la pagina una vez - por si se colgo
    try {
      await page.waitForSelector("#tab-data-qa-reviews-0", { timeout: tiempo_espera });
    } catch (error) {
      console.log("Error #tab-data-qa-reviews-0");
      await page.reload();
      await page.waitForSelector("#tab-data-qa-reviews-0", { timeout: tiempo_espera });
    }

    const cookies = await page.$('#onetrust-accept-btn-handler');
    if (cookies) {
      console.log("Existe Cookies")
      await page.waitForSelector("#onetrust-accept-btn-handler", { timeout: tiempo_espera });
      await cookies.click();
    }

    await new Promise(r => setTimeout(r, 10000));
    
    await page.evaluate(() => {
      return location.href = "#tab-data-qa-reviews-0";
    }); 

    await new Promise(r => setTimeout(r, 5000));
       
    await page.evaluate(() => {
      return location.href = "#tab-data-qa-reviews-0";
    }); 

    const filtros = await page.$('#tab-data-qa-reviews-0');
    if (filtros) {
      console.log("Hay filtros");
      const primer_boton = await filtros.$('.OKHdJ:nth-of-type(1)');     
      const title_filtros = await (await primer_boton.getProperty('textContent')).jsonValue();
      await new Promise(r => setTimeout(r, 2000));
      console.log("Boton -> "+title_filtros);
      await primer_boton.click();
      await new Promise(r => setTimeout(r, 5000));
      
      try {
        await page.waitForSelector(".HyAcm > .WMIKb", { timeout: tiempo_espera });
      } catch (error) {

        try {
          if(title_filtros.trim() === 'Filtros'){
            console.log(`Intentamos nuevo click en Filtros`) 
            await primer_boton.click();
            await new Promise(r => setTimeout(r, 2500));
            await page.waitForSelector(".HyAcm > .WMIKb", { timeout: tiempo_espera });
          }
        } catch (error) {
          console.log(title_filtros + `-----> ERROR CLICK FILTROS - ${workerData.url}`) 
          await page.close();
          await browser.close();
          throw (`-----> ERROR CLICK FILTROS - ${workerData.url}`) 
        }
      }

      const modal_filtros = await page.$('.HyAcm > .WMIKb');      
      const mas_filtros = await modal_filtros.$('.YmElR > .qgcDG');           

      if (mas_filtros) {
        console.log("Hay mas filtros");
        const boton4 = await mas_filtros.$('.OKHdJ:nth-of-type(4)');
        await boton4.click();

        await new Promise(r => setTimeout(r, 1500));

        const boton5 = await mas_filtros.$('.OKHdJ:nth-of-type(5)');
        await boton5.click();

        await new Promise(r => setTimeout(r, 1500));

        const boton_aplicar = await page.$(".HllFM > .zUwOc > div[data-button-type='primary'] > button");
        if (boton_aplicar) {
          console.log("Aplicamos filtros");
          await boton_aplicar.click();
          await new Promise(r => setTimeout(r, 10000));
          let elemento_pagina = await trae_comentarios(page);

          while (elemento_pagina!==null && comentarios_grabados < 100){
            await elemento_pagina.click();
            await new Promise(r => setTimeout(r, 10000));
            elemento_pagina = await trae_comentarios(page);
          }

        }else{
          console.log(`-----> SIN APLICAR FILTROS - ${workerData.url}`)
          await page.close();
          await browser.close();
          throw (`-----> SIN APLICAR FILTROS - ${workerData.url}`) 
        }

      }else{
        console.log(title_filtros + `-----> SIN MAS FILTROS - ${workerData.url}`)
        await page.close();
        await browser.close();
        throw (`-----> SIN MAS FILTROS - ${workerData.url}`) 
      }

    }else{
      console.log(`-----> SIN BOTON FILTROS - ${workerData.url}`)
        await page.close();
        await browser.close();
        throw (`-----> SIN BOTON FILTROS - ${workerData.url}`) 
    }

    console.log(`${workerData?.contador_trabajos} -> ${workerData.ip_proxy} ${workerData.nameWorker} - ${workerData.url}`);

    if(comentarios_grabados < 13){
      console.log("-------------------------> ERROR - SOLO TIENE "+ comentarios_grabados +" COMENTARIOS")
      await mongo.Atraccion.updateOne({ _id: workerData.idatraccion }, { $set: { estado_scrapeo_comentarios: 'ERROR' } });
    } else {
      await mongo.Atraccion.updateOne({ _id: workerData.idatraccion }, { $set: { estado_scrapeo_comentarios: 'FINALIZADO' } });
    }
    
    await page.close();
    await browser.close();
    process.exit();

  } catch (error) {
    console.log("Error en Worker ", error)
    process.exit();
  }
})();
// ****************************************** MAIN  ******************************************** //