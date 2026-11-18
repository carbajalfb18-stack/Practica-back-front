import base from "../services/base.js";
import { useContext, createContext} from "react";


const ModeloContext = createContext(null);

export const ModeloProvider = ({children}) => {
    const findAll = async () => {
        return await base.get('/modelos');
    }

    const create = async (marcaId, nombre) => {
        return await base.post('/modelos', {marcaId, nombre});
    }

    return (

        <ModeloContext.Provider value = {{findAll, create}}>
            {children}
        </ModeloContext.Provider>
    );

};

export const useModelo = () => useContext(ModeloContext);
export default ModeloContext;