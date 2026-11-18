import base from "../services/base.js"
import { useContext, createContext } from "react"

const MarcaContext = createContext(null);

export const MarcaProvider = ({children}) => {

    const findAll = async () => {
        return await base.get('/marcas');
    }

    const create = async (marca) => {
        return await base.post('/marcas', {...marca});
    };

    return (

        <MarcaContext.Provider value={{findAll, create}}>
            {children}
        </MarcaContext.Provider>

    );

};

export const useMarca = () => useContext(MarcaContext);
export default MarcaContext;