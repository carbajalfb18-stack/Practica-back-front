import { Marca, Modelo } from '../models/relaciones.js'
import RepositoryBase from "./RepositoryBase.js";


const repository = new RepositoryBase(Marca);

// se modifica porque se pidio
repository.findAll = async () => {
    try { 
        const includeCompleto = {
                // Qué columnas de Marca quieres incluir
                model: Modelo,
                attributes: ['id', 'nombre']
        }
        
        return await Marca.findAll({
            include: includeCompleto // Hacer el JOIN con Marca
        })
    } catch (error) {
        console.log(error)
    }
}

export default repository;

