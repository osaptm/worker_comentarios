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
const tiempo_espera = 15000;
// ************* Variable requeridas ************* //

function nombre_final_sin_numeracion(nombre) {
  const nombre_final_array = nombre.split('. ');
  const eliminar_primero = nombre_final_array.shift();
  const nombre_final = nombre_final_array.join('');
  return nombre_final;
}

async function get_h1_page(page) {
  const h1_page = await page.$("h1");
  if(!h1_page) return "";
  return await (await h1_page.getProperty('textContent')).jsonValue();
}


async function get_breadcrumbs(page, url_actual) {
  const breadcrumbs = await page.$$("div[data-automation='breadcrumbs'] > div");
  const obj_breadcrumbs = {
    datos: []
  };

  for await (let element of breadcrumbs) {
    const title_breadcrumbs = await (await element.getProperty('textContent')).jsonValue();
    const enlace = await element.$('a:nth-of-type(1)');
    const enlace_breadcrumbs = enlace !== null ? await (await enlace.getProperty('href')).jsonValue() : url_actual;
    const objBreadcrumbs = {
      title: title_breadcrumbs,
      enlace: enlace_breadcrumbs,
    }
    obj_breadcrumbs.datos.push(objBreadcrumbs);
  }

  return obj_breadcrumbs;
}


async function get_seccion_categorias_reviews(page) {
  const obj_categorias_reviews = {};
  const seccion_categorias_reviews = await page.$("section div[data-automation='WebPresentation_PoiOverviewWeb']");
  if(!seccion_categorias_reviews){ return obj_categorias_reviews;}

  const categorias_reviews = await seccion_categorias_reviews.$$(".kUaIL");   
  for await (let element of categorias_reviews) {

    const reviews = await element.$(".jVDab");
    if (reviews) {
      const attrValue = await reviews.evaluate(el => el.getAttribute('aria-label'));
      //const attrValue = await element.$eval('.jVDab', el => el.getAttribute('aria-label'));
      const separar_valores = attrValue.split("burbujas.");
      const puntuacion = separar_valores[0].trim();
      let numero_reviews = (separar_valores[1].replace("opiniones", "")).trim();
      numero_reviews = (numero_reviews.replace("opinión", "")).trim();
      numero_reviews = (numero_reviews.replace(",", "")).trim();
      numero_reviews = (numero_reviews.replace(".", "")).trim();
      obj_categorias_reviews['reviews'] = Number(numero_reviews);
      obj_categorias_reviews['puntuacion'] = puntuacion;
    }

    const texto_ = await (await element.getProperty('textContent')).jsonValue();

    if (texto_.includes("N.º")) {
      obj_categorias_reviews['ranking'] = texto_;
    }

    if (texto_.includes("Leer más")) {
      obj_categorias_reviews['categoria'] = texto_.replace("Leer más", "").trim();
    }

  }

  return obj_categorias_reviews;
}


async function get_seccion_acerca(page) {
  const obj_seccion_acerca = {};
  const seccion_acerca = await page.$(".QvCXh > .yNgTB");
  if (seccion_acerca) {
    const acerca = await seccion_acerca.$(".WRRwX");
    if(!acerca) return obj_seccion_acerca;
    
    const duracion = await acerca.$(".tyUdl > ._c");
    let texto_ = "";
    if (duracion) {
      texto_ = await (await duracion.getProperty('textContent')).jsonValue();
      if (texto_.trim() !== "") {
        obj_seccion_acerca['duracion'] = texto_ ;
      }
    }
    texto_ = "";
    const entrada = await acerca.$(".MQPqk > .C > .YqMbD > div:nth-of-type(1)");
    if (entrada) {
      texto_ = await (await entrada.getProperty('textContent')).jsonValue();
      if(texto_.includes("S/")){

        const soles = texto_.split("S/");
        if (soles.length !== 2) {
          obj_seccion_acerca['entrada'] = texto_ ;
        } else {
          obj_seccion_acerca['entrada'] = soles[1].trim() ;
        }

      }

    }
  }
  return obj_seccion_acerca;
}

async function get_seccion_fotos(page) {
  const obj_seccion_fotos = { datos: [] };
  const seccion_fotos = await page.$(".FdLSX > .C > .hsimV");
  if (seccion_fotos) {
    const array_fotos = await seccion_fotos.$$(".MPTGl > .qrDQR > div > .PLMuc");
    if (array_fotos.length !== 0) {
      for (const htmlFoto of array_fotos) {
        const foto = await htmlFoto.$("picture > img");
        let urlFoto = await foto.evaluate(el => el.getAttribute('src'));
        urlFoto = urlFoto.replace("w=100&h=-1&s=1", "w=1000")
        obj_seccion_fotos.datos.push(urlFoto);
      }
    }
  }
  return obj_seccion_fotos;
}


async function get_disfrutar(page) {
  const obj_disfrutar = { datos: [] };
  const seccion_disfrutar = await page.$("div[data-automation='WebPresentation_MediumCardsCarouselWeb']");
  if (seccion_disfrutar) {
    const seccion_ = await page.$(".HbQoi");

    const opciones_disfrutar = await seccion_.$$(".NcGPW > .biGQs > .keSJi");
    if (opciones_disfrutar.length !== 0) {
      for (const opcion of opciones_disfrutar) {
        texto_ = await (await opcion.getProperty('textContent')).jsonValue();
        obj_disfrutar.datos.push(texto_);
      }
    }
  }
  return obj_disfrutar;
}

async function get_location(page) {
  const obj_location = {};

  try {
    await page.waitForSelector("div[data-automation='WebPresentation_PoiLocationSectionGroup'] > .QvCXh > .AcNPX > .gptQH > .C > .YWGPI > span > img", { timeout: tiempo_espera });
  } catch (error) {
    try {
      await page.reload();
      await page.waitForSelector("div[data-automation='WebPresentation_PoiLocationSectionGroup'] > .QvCXh > .AcNPX > .gptQH > .C > .YWGPI > span > img", { timeout: tiempo_espera });
    } catch (error) {
      return obj_location;
    }
  }

  const seccion_location = await page.$("div[data-automation='WebPresentation_PoiLocationSectionGroup'] > .QvCXh > .AcNPX > .gptQH");
  if (seccion_location) { 
    //const html = await (await seccion_location.getProperty('innerHTML')).jsonValue();
    const seccion_ = await seccion_location.$(".oPZZx");
    if (seccion_) { 
      let src_location = await seccion_.evaluate(el => el.getAttribute('src'));
      const array_querys = src_location.split("&");
      for (const query of array_querys) {
        if (query.includes("center")) {
          obj_location['coordenadas'] = query.replace("center=", "").trim();
        }
      }
    }
  }

  return obj_location;
}



async function get_opiniones(page) {
  const obj_opiniones = {};
  const existen_reviews = await get_seccion_categorias_reviews(page);
  if ( Object.keys(existen_reviews).length !== 0) {
    for (const dato of Object.keys(existen_reviews)) {
      if (dato === 'reviews') {
        const numero_comentarios = existen_reviews[dato];
        if (numero_comentarios > 0) {

          try {
            await page.waitForSelector("#tab-data-qa-reviews-0", { timeout: tiempo_espera });
          } catch (error) {
            try {
              await page.reload();
              await page.waitForSelector("#tab-data-qa-reviews-0", { timeout: tiempo_espera });
            } catch (error) {
              return obj_location;
            }
          }
          const seccion_reviews = await page.$("#tab-data-qa-reviews-0 > .eSDnY > .bdeBj > .C");
          if (seccion_reviews) {
            const array_opiniones = await seccion_reviews.$$(".Ml > ._S > .IMmqe");
            for (const opinion of array_opiniones) {
              const texto_ = await (await opinion.getProperty('textContent')).jsonValue();
              let numero_por_opinion = "";
              if (texto_.includes("Excelente")) {
                numero_por_opinion = ((texto_.replace("Excelente", "")).replace(',', '')).replace('.', '');
                obj_opiniones['Excelente'] = Number(numero_por_opinion);
              }
              if (texto_.includes("Muy bueno")) {
                numero_por_opinion = ((texto_.replace("Muy bueno", "")).replace(',', '')).replace('.', '');
                obj_opiniones['Muy_bueno'] =Number(numero_por_opinion);
              }
              if (texto_.includes("Promedio")) {
                numero_por_opinion = ((texto_.replace("Promedio", "")).replace(',', '')).replace('.', '');
                obj_opiniones['Promedio'] = Number(numero_por_opinion);
              }
              if (texto_.includes("Mala")) {
                numero_por_opinion = ((texto_.replace("Mala", "")).replace(',', '')).replace('.', '');
                obj_opiniones['Mala'] = Number(numero_por_opinion);
              }
              if (texto_.includes("Horrible")) {
                numero_por_opinion = ((texto_.replace("Horrible", "")).replace(',', '')).replace('.', '');
                obj_opiniones['Horrible'] = Number(numero_por_opinion);
              }
            }
          }
        }
      }
    }
  } 
  return obj_opiniones;
}



// ****************************************** MAIN  ******************************************** //
(async () => {
  try {
    await db_tripadvisor_x_ciudad();
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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout:10000 });
      
    //Esoeramos por los comentarios -> si no aparece recargamos la pagina una vez - por si se colgo
    try {
      await page.waitForSelector("footer", { timeout: tiempo_espera });
    } catch (error) {
      console.log("Error footer");
      await page.reload();
      await page.waitForSelector("footer", { timeout: tiempo_espera });
    }

    let cantidad_scrapeado = 0;
    const location = await get_location(page); 
      if( Object.keys(location).length !== 0) cantidad_scrapeado ++;     

    const h1_page = await get_h1_page(page);
      if(h1_page.trim() !== "") cantidad_scrapeado ++;

    const breadcrumbs = await get_breadcrumbs(page, url);
      if(breadcrumbs.datos.length !== 0) cantidad_scrapeado ++; 

    const seccion_categorias_reviews = await get_seccion_categorias_reviews(page);
      if( Object.keys(seccion_categorias_reviews).length !== 0) cantidad_scrapeado ++;  

    const seccion_acerca = await get_seccion_acerca(page);
      if( Object.keys(seccion_acerca).length !== 0) cantidad_scrapeado ++;  

    const seccion_fotos = await get_seccion_fotos(page);  
      if(seccion_fotos.datos.length !== 0) cantidad_scrapeado ++; 

    const disfrutar = await get_disfrutar(page);   
      if(disfrutar.datos.length !== 0) cantidad_scrapeado ++; 

    const opiniones = await get_opiniones(page); 
      if(Object.keys(opiniones).length !== 0) cantidad_scrapeado ++; 


    await mongo.Atraccion.updateOne({ _id: workerData.idatraccion }, { $set: { 
      estado_scrapeo: 'FINALIZADO',
      h1_page:            h1_page,  
      breadcrumbs:        breadcrumbs, 
      categorias_reviews: seccion_categorias_reviews,  
      acerca:             seccion_acerca,  
      fotos:              seccion_fotos,  
      disfrutar:          disfrutar,  
      location:           location,  
      opiniones:          opiniones,
      cantidad_scrapeado: cantidad_scrapeado 
    } }); 

    const title_page = await page.title(); 
    console.log(`${workerData?.contador_trabajos} -> ${workerData.ip_proxy} ${workerData.nameWorker}\n${title_page}\n${workerData.url}`);

    await page.close();
    await browser.close();
    process.exit();

  } catch (error) {
    await mongo.Atraccion.updateOne({ _id: workerData.idatraccion }, { $set: { estado_scrapeo: 'PENDING' } });
    console.log("Error en Worker ", error)
    process.exit();
  }
})();
// ****************************************** MAIN  ******************************************** //