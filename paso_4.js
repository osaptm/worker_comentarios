const { db_conexion } = require('./database/config');
const mongo = require('./models');
const { ObjectId } = require('mongoose').Types;
async function paso_4(){
    try {
        await db_conexion();
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
                estado_paginacion_creada:1
              },
            }, 
            {
                $match: {
                    estado_scrapeo_nro : 'FINALIZADO',
                    estado_paginacion_creada : { $ne :  'FINALIZADO'}
                }
            }          
          ]);

        
        console.log("GENERAR PAGINACION DE = " +consulta.length);

        if (consulta.length !== 0) {
            for (let index = 0; index < consulta.length; index++) { 
                await mongo.Categoria_atraccion_ciudad.updateOne({ _id: consulta[index]._id }, { $set: { estado_paginacion_creada: 'FINALIZADO' } });            
                const enteroPag = Math.ceil(consulta[index].numero_atracciones / 30);
                let existe = null;
                //console.log(consulta[index].url)
                if(enteroPag === 0) { continue; }
                if(enteroPag === 1){                    

                    existe = await mongo.Pagina.findOne({
                        url_actual: consulta[index].url,
                        numero_actual: 1,
                        id_categoria_atraccion_ciudad: consulta[index]._id
                    });   

                    if(existe !== null) continue;
                    
                    await mongo.Pagina.create([{
                    url_actual: consulta[index].url,
                    numero_actual: 1,
                    id_categoria_atraccion_ciudad: consulta[index]._id
                    }]);

                }else{
                    const cantidad_por_pagina = 30;
                    const url = consulta[index].url;
                    const idrecurso = consulta[index]._id;
                    let nueva_url = "";                
    
                    if(url!==""){
                       
                        existe = await mongo.Pagina.findOne({
                            url_actual: url,
                            numero_actual: 1,
                            id_categoria_atraccion_ciudad: idrecurso
                        });   

                        if(existe===null) {
                            await mongo.Pagina.create([{
                            url_actual: url,
                            numero_actual: 1,
                            id_categoria_atraccion_ciudad: idrecurso
                            }]);
                         }

                    }
    
                    for (let w = 1; w < enteroPag; w++) {
                        nueva_url = ""; 
                        const codigo_url_oa0 = url.match(/\-oa0-/);
                        if(codigo_url_oa0 !== null){
                           nueva_url = url.replace(/\-oa0-/,`-oa${cantidad_por_pagina*w}-`);
                        }else{
                            const codigo_url_c = url.match(/\-c\d+\-/);
                            if(codigo_url_c !== null){
                                nueva_url = url.replace(/(\-c\d+\-)/,`$1oa${cantidad_por_pagina*w}-`);
                            }
                        }
                        if(nueva_url!==""){
                           
                            existe = await mongo.Pagina.findOne({
                                url_actual: nueva_url,
                                numero_actual: (w+1),
                                id_categoria_atraccion_ciudad: idrecurso
                            });   
    
                            if(existe === null) {
                                await mongo.Pagina.create([{
                                url_actual: nueva_url,
                                numero_actual: (w+1),
                                id_categoria_atraccion_ciudad: idrecurso
                                }]);
                             }else{
                                await mongo.Pagina.updateOne({_id:existe._id},{numero_actual: (w+1)});
                             }
                           
                        }
                         
                    }
                }

                   
            }
        }else{
            console.log("NO HAY Categoria_atraccion_ciudad ")
        }
        
        console.log("Fin Tarea...")
        process.exit();
    } catch (error) {
        console.log("FINALIZAMOS TAREAS" + error);
        process.exit();
    }

};


(async () =>{ await paso_4(); })();

