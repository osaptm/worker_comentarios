const { db_conexion } = require('./database/config');
const mongo = require('./models');
const { ObjectId } = require('mongoose').Types;


async function paso(){

    try {
        // NUEVA CONEXION MONGO
        await db_conexion("127.0.0.1");
        const atracciones = await mongo.Atraccion.find({
            $or:[
                {id_pais:{$exists:false}},
                {id_ciudad:{$exists:false}},
                {id_categoria:{$exists:false}},
            ]
        });
      
        var id_categoria = '';
        var id_pais = '';
        var id_ciudad = '';
        for (const atra of atracciones) {
            const detalle = await mongo.Atraccion_x_categoria.findOne({id_atraccion : atra._id});
            if(detalle !== null){
                const otro_detalle = await mongo.Categoria_atraccion_ciudad.findOne({_id : detalle.id_categoria_atraccion_ciudad});
                if(otro_detalle !== null){
                    id_categoria = otro_detalle.id_categoira_atraccion;
                    id_ciudad = otro_detalle.id_ciudad;
                    const ciudad = await mongo.Ciudad.findOne({_id : otro_detalle.id_ciudad});
                    id_pais = ciudad.id_pais;
                    await mongo.Atraccion.updateOne({_id:atra._id},{
                        id_categoria : id_categoria,
                        id_ciudad : id_ciudad,
                        id_pais : id_pais
                    });
                }else{
                    console.log("Error Sin otro Detalle");
                }
            }else{
                console.log("Error Sin Detalle");
            }
        }

     
        process.exit();
    } catch (error) {
        console.log("FINALIZAMOS TAREAS" + error);
        process.exit();
    }

};

(async () =>{ await paso(); })();
