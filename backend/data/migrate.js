import sequelize from '../config/database.js';
import { Marca, Modelo } from '../models/relaciones.js';

async function migrate() {
  try {
    await sequelize.sync({ force: true });

    await Marca.create({ nombre: 'Chevrolet', pais: 'Estados Unidos' });
    await Marca.create({ nombre: 'Mazda', pais: 'Japon' });
    await Marca.create({ nombre: 'Mitsubishi', pais: 'Japon' });

    await Modelo.create({ nombre: 'Lancer', marcaId: 3 });

    console.log('Migración completada con éxito!');
  } catch (error) {
    console.log(error);
  }
}

migrate();

//(Si algún día lo quieres correr, apagas el servidor un segundo, ejecutas npm run migrate en la consola y vuelve a llenar tus tablas desde cero).