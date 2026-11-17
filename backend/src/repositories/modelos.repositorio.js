import { Model } from 'sequelize';
import { Marca, Modelo } from '../models/relaciones.js'
import RepositoryBase from "./RepositoryBase.js";


const repository = new RepositoryBase(Modelo);

// se modifica porque pertene belongsto a marcas
repository.findAll = async () => {
    try { 
        const includeCompleto = {
                // Qué columnas de Marca quieres incluir
                model: Marca,
                attributes: ['id', 'nombre']
        }
        
        return await Modelo.findAll({
            include: includeCompleto // Hacer el JOIN con Marca
        })
    } catch (error) {
        console.log(error)
    }
}


export default repository;