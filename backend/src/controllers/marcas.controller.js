import repository from "../repositories/marcas.repository.js";



// lo que pide el doc
const findAll = async ( req , resp) => {
    const respuesta =  await repository.findAll();
    return sendResponse (respuesta,"No se encontro ", 404, resp);
}

const create = async ( req , resp) => {
    const Payload = req.body;
    const respuesta = await repository.create(Payload);
    return sendResponse(respuesta, 'No se creo' , 404, resp);
   
}


    
// lo que estoy practicando

const findOne = async ( req, resp) => {
    const respuesta = await repository.findOne(req.params.id);
    return sendResponse(respuesta, 'no se encontro ', 404, resp);
}

const update = async ( req, resp) => {
    const Payload = req.body;
    const respuesta = await repository.update(Payload);
    return sendResponse(respuesta, 'no se actualizo ', 404, resp);
}

const remove = async ( req, resp) => {
    const direccion = req.params.id;
    const respuesta = await repository.remove(direccion);
    return sendResponse(respuesta, 'no se encontro ', 404, resp)
}




const controller = { findAll, findOne, create, update, remove}


const sendResponse = (respuesta, menssage, errorCode, resp) => {
  if (!respuesta)
    return resp.status(errorCode).json({ success: false, menssage });
  else
    return resp.status(200).json(respuesta);
}


export default controller;