# 📘 Guía Definitiva de Backend para el Examen (Express + Sequelize + PostgreSQL)

Esta guía resume **paso a paso** cómo construir el Backend desde cero siguiendo la guía de clase, explica el porqué de cada línea de código y recopila **todas las preguntas, dudas y errores reales** que resolvimos durante la práctica.

---

## 1. Mapa de la Arquitectura (¿Cómo viaja una petición?)

```
1. Cliente (.http / Navegador / React)
       │  (Petición HTTP: GET / POST)
       ▼
2. index.js ──────► Levanta el puerto 3005 y ejecuta sequelize.sync()
       │
       ▼
3. app.js ────────► Configura bodyParser.json(), cors() y las URLs (/marcas, /modelos)
       │
       ▼
4. src/routes/*.routes.js ──────► Conecta GET / POST con las funciones del controlador
       │
       ▼
5. src/controllers/*.controller.js ──► Recibe (req, resp), saca req.body y llama al repositorio
       │
       ▼
6. src/repositories/*.repository.js ─► Usa RepositoryBase y personaliza findAll con "include"
       │
       ▼
7. src/models/relaciones.js ────► Conecta las tablas con hasMany y belongsTo (foreignKey: "marcaId")
       │
       ▼
8. src/models/marca.js y modelo.js ─► Define las columnas con sequelize.define()
       │
       ▼
9. src/config/database.js ──────► Conecta con PostgreSQL (marcasdb, contraseña: 123)
```

> **¡IMPORTANTE! ¿Por qué en el Paso 9 y 10 no se crea la tabla si no conectas todo hasta `app.js`?**
> Cuando ejecutas `npm run dev` (que corre `index.js`), Node solo carga `index.js` y `app.js`. Si `app.js` no importa tus rutas (`marcas.routes.js`), entonces la ruta no importa al controlador, el controlador no importa al repositorio y el repositorio **nunca importa al modelo (`marca.js`)**. Si el modelo no es importado por nadie, Sequelize no sabe que existe y **no crea la tabla en PostgreSQL**.

---

## 2. Diccionario de Nombres: ¿Por qué hay tantos `marca` y `marcas`?

Una de las dudas más importantes que resolvimos es distinguir qué significa `marca` o `marcas` según el archivo donde esté escrito:

| Dónde se escribe | Cómo se escribe | ¿Qué es y para qué sirve? |
| :--- | :--- | :--- |
| En **`app.js`**: `app.use('/marcas', marcasRouter)` | **`/marcas`** | **Es la dirección URL del API.** De aquí sale el `/marcas` que escribes en `http://localhost:3005/marcas` dentro de tu archivo `.http` o en el navegador. Si aquí pusieras `'/autos'`, la URL sería `http://localhost:3005/autos`. |
| En **`marca.js`**: `sequelize.define('marca', ...)` | **`'marca'`** | **Es el nombre del Modelo en Sequelize.** Lo escribes en singular y Sequelize automáticamente le agrega una `s` al final para crear la tabla **`marcas`** en PostgreSQL. |
| En **`relaciones.js`**: `{ foreignKey: "marcaId" }` | **`"marcaId"`** | **Es el nombre de la columna (llave foránea)** dentro de la tabla `modelos` que guarda el ID de la marca a la que pertenece. |
| En tus carpetas `src/`: `marca.js`, `marcas.repository.js`, `marcas.controller.js`, `marcas.routes.js` | **Nombres con `.js`** | **Son solo los nombres de tus archivos en Windows.** Solo sirven para llamarlos en las líneas `import ... from '...js'`. |

---

## 3. Paso a Paso del Código (Con Plantillas Listas para el Examen)

### Paso 1 y 5: `package.json` y Conexión a Base de Datos (`src/config/database.js`)
- En `package.json`, la línea `"type": "module"` es la que permite usar `import` / `export` y **obliga a poner siempre `.js` al final de cada `import`**.
- En `database.js` van los datos de tu PostgreSQL local:

```javascript
import Sequelize from 'sequelize'
import pg from 'pg'

const hostname = 'localhost'; // Servidor local (127.0.0.1)
const username = 'postgres';  // Usuario de PostgreSQL
const password = '123';       // ¡OJO! Pon aquí la contraseña de TU pgAdmin (en tu PC es '123')
const database = 'marcasdb';  // Nombre exacto de la BD que creaste en pgAdmin 4
const port = 5432;
const dialect = 'postgres';

const sequelize = new Sequelize(database, username, password, {
  host: hostname,
  port,
  dialect,
  dialectModule: pg
});

export default sequelize;
```

---

### Paso 3: Archivos Base (`index.js` y `app.js`)

- **`index.js`**: Sincroniza Sequelize con PostgreSQL (`sequelize.sync`) y enciende el servidor en el puerto `3005`.
- **`app.js`**: Configura Express (`bodyParser.json()` y `cors()`) y conecta las rutas principales:

```javascript
import express from 'express'
import bodyParser from 'body-parser';
import cors from 'cors';

// ¡OJO! app.js SIEMPRE importa desde la carpeta ./src/routes/ (NUNCA desde controllers)
import marcasRouter from './src/routes/marcas.routes.js'
import modelosRouter from './src/routes/modelos.routes.js'

const app = express();
app.use(bodyParser.json()); // Permite leer el JSON que llega en req.body
app.use(cors());            // Permite que React se conecte sin bloqueo de CORS

app.get('/', (req, resp) => {
  return resp.json({ message: "HEALTHY", code: 200})
})

app.use('/marcas', marcasRouter);
app.use('/modelos', modelosRouter);

export default app;
```

---

### Paso 6 y 12: Los Modelos (`src/models/marca.js` y `src/models/modelo.js`)

Todo modelo tiene **3 partes**:
1. Importar `sequelize` (de `../config/database.js`) y `{ DataTypes }` (de `'sequelize'`).
2. Definir el modelo con `sequelize.define('nombreEnSingular', { columnas })`.
3. Exportar el modelo con `export default`.

```javascript
// src/models/modelo.js
import sequelize from '../config/database.js'
import { DataTypes } from 'sequelize'

const Modelo = sequelize.define('modelo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    marcaId: {
        type: DataTypes.INTEGER
    }
})

export default Modelo
```

---

### Paso 14 (Parte A): El Archivo de Relaciones (`src/models/relaciones.js`)

Conecta las dos tablas (**1 Marca tiene Muchos Modelos**):

```javascript
import Marca from "./marca.js";
import Modelo from "./modelo.js";

// Una Marca tiene muchos Modelos (hasMany)
Marca.hasMany(Modelo, { foreignKey: "marcaId" });

// Un Modelo pertenece a una Marca (belongsTo)
Modelo.belongsTo(Marca, { foreignKey: "marcaId" });

export { Marca, Modelo };
```

> **⚠️ Cuidado con el autocompletado de `foreignKey`:**
> Debe escribirse en **camelCase** (`foreignKey`, solo con la **K** mayúscula). Si el editor te lo autocompleta en mayúsculas como `FOREIGNKEY`, **bórralo y corrígelo**, porque Sequelize no reconoce `FOREIGNKEY`.

---

### Paso 7 y 14 (Parte B): Los Repositorios (`marcas.repository.js` y `modelos.repositorio.js`)

- Primero copias `RepositoryBase.js`, que ya trae hechas las 5 funciones básicas (`findAll`, `create`, `findOne`, `update`, `remove`).
- En el repositorio de cada tabla, creas `new RepositoryBase(...)` y, cuando te piden que `findAll()` devuelva también la tabla relacionada, sobrescribes `repository.findAll` usando **`include`**:

```javascript
// src/repositories/modelos.repositorio.js
import { Marca, Modelo } from '../models/relaciones.js'
import RepositoryBase from "./RepositoryBase.js";

const repository = new RepositoryBase(Modelo);

// Sobrescribimos findAll para que incluya los datos de la Marca (JOIN)
repository.findAll = async () => {
    try { 
        const includeCompleto = {
            model: Marca,                // Qué modelo queremos cruzar
            attributes: ['id', 'nombre'] // Qué columnas de Marca queremos mostrar
        }
        
        return await Modelo.findAll({
            include: includeCompleto
        })
    } catch (error) {
        console.log(error) // ¡Siempre pon console.log(error) para ver fallos en consola!
    }
}

export default repository;
```

> **🚨 Dos errores que resolvimos aquí y no debes repetir en el examen:**
> 1. Dentro de `includeCompleto` **NO pongas `id: { ... }`**. `model` y `attributes` van directo dentro de `includeCompleto`.
> 2. Al hacer `return await Modelo.findAll(...)`, escribe **`Modelo`** (con **o** al final, tu modelo en español), **no `Model`** en inglés (porque VS Code importa `{ Model } from 'sequelize'` que está vacío y hace que devuelva `No se encontró`).

---

### Paso 8: Los Controladores (`marcas.controller.js` y `modelos.constroller.js`)

El controlador recibe `(req, resp)` de Express, llama al repositorio con **`await`** y responde usando `sendResponse`:

```javascript
import repository from "../repositories/marcas.repository.js";

const findAll = async (req, resp) => {
    const respuesta = await repository.findAll();
    return sendResponse(respuesta, "No se encontro ", 404, resp);
}

const create = async (req, resp) => {
    const Payload = req.body; // Aquí llega el JSON que enviaste en el POST
    const respuesta = await repository.create(Payload);
    return sendResponse(respuesta, 'No se creo', 400, resp);
}

const findOne = async (req, resp) => {
    const respuesta = await repository.findOne(req.params.id); // Lee el :id de la URL
    return sendResponse(respuesta, 'no se encontro ', 404, resp);
}

const update = async (req, resp) => {
    const Payload = req.body;
    const respuesta = await repository.update(Payload);
    return sendResponse(respuesta, 'no se actualizo ', 400, resp);
}

const remove = async (req, resp) => {
    const direccion = req.params.id;
    const respuesta = await repository.remove(direccion);
    return sendResponse(respuesta, 'no se encontro ', 404, resp);
}

const sendResponse = (respuesta, menssage, errorCode, resp) => {
  if (!respuesta)
    return resp.status(errorCode).json({ success: false, menssage });
  else
    return resp.status(200).json(respuesta);
}

const controller = { findAll, findOne, create, update, remove }

export default controller;
```

---

### Paso 8 y 9: Las Rutas (`marcas.routes.js` y `modelos.routes.js`)

Conectan cada verbo HTTP (`GET`, `POST`, `PUT`, `DELETE`) con su función del controlador:

```javascript
import controller from "../controllers/marcas.controller.js";
import express from 'express';

const router = express.Router();

router.get('/', controller.findAll);
router.get('/:id', controller.findOne);
router.post('/', controller.create);
router.put('/', controller.update);
router.delete('/:id', controller.remove); // ¡Recuerda poner '/:id' en delete y findOne!

export default router;
```

---

### Paso 15: Migración / Data Inicial (`src/data/migrate.js`)

- **¿Cómo recordar dónde se crea?** Mira la línea 13 de tu `package.json`: `"migrate": "node src/data/migrate.js"`. Ahí mismo te dice la carpeta (`src/data`) y el archivo (`migrate.js`).

```javascript
import sequelize from '../config/database.js';
import { Marca, Modelo } from '../models/relaciones.js';

async function migrate() {
  try {
    await sequelize.sync({ force: true }); // Borra y recrea las tablas limpias

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
```

---

## 4. Preguntas y Respuestas Clave sobre el Archivo `.http` y las Pruebas (`test/pruebas.http`)

### ❓ 1. ¿Qué hacen exactamente `POST` y `GET`?
- **`POST`** = **Crear / Insertar un dato nuevo** en la base de datos (`INSERT`). Entra por `router.post('/', controller.create)`, toma el JSON que enviaste en `req.body` y lo guarda en PostgreSQL.
- **`GET`** = **Leer / Consultar datos** (`SELECT`). Entra por `router.get('/', controller.findAll)` y devuelve el arreglo JSON con todas las filas guardadas. No lleva cuerpo JSON ni `Content-Type`.

### ❓ 2. ¿De dónde sale `Content-Type: application/json`?
- Es una cabecera estándar universal del protocolo HTTP.
- Le avisa a la línea `app.use(bodyParser.json())` de tu `app.js` que el bloque de abajo es un objeto JSON para que lo convierta y lo meta dentro de **`req.body`**. Si no lo pones en un `POST`, `req.body` llega vacío.

### ❓ 3. ¿Dónde son obligatorias las MAYÚSCULAS y minúsculas en `pruebas.http`?
```http
POST http://localhost:3005/marcas
Content-Type: application/json

{
  "nombre": "Chevrolet",
  "pais": "Estados Unidos"
}

###
GET http://localhost:3005/marcas
```
1. **`POST` y `GET`:** Escríbelos en **MAYÚSCULAS**.
2. **`Content-Type: application/json`:** No importa si está en mayúsculas o minúsculas, pero **es 100% obligatorio dejar UNA LÍNEA EN BLANCO** justo debajo de él antes de abrir `{`.
3. **Las claves del JSON (`"nombre"`, `"pais"`, `"marcaId"`):** **¡Aquí las minúsculas/mayúsculas son 100% obligatorias!** Tienen que escribirse **idéntico** a como las definiste en `marca.js` y `modelo.js`.
4. **Los valores (`"Chevrolet"`, `"Estados Unidos"`):** Es solo el texto que quieres guardar; puedes escribirlo como quieras.

### ❓ 4. ¿Por qué al abrir `http://localhost:3005/marcas` en el navegador salía `[]` vacío?
- Porque escribir el archivo `pruebas.http` y guardarlo con `Ctrl + S` **no envía los datos a la base de datos**.
- Tienes que tener instalada la extensión **REST Client** en VS Code y hacer clic en el botoncito **"Send Request"** que aparece arriba de cada `POST`.

### ❓ 5. ¿Cómo ver las tablas y los datos dentro de pgAdmin 4?
1. **Para ver la tabla creada:** Ve a `Servers` ➡️ `PostgreSQL` ➡️ `Databases` ➡️ `marcasdb` ➡️ `Schemas` ➡️ `public` ➡️ **`Tables`**. Si no aparece, haz **clic derecho sobre `Tables` > `Refresh...`**.
2. **Para ver las filas insertadas:** Haz **clic derecho sobre la tabla `marcas` (o `modelos`)** ➡️ **`View/Edit Data`** ➡️ **`All Rows`**.

---

## 5. Checklist Anti-Errores para el Día del Examen ✅

Antes de levantar tu servidor en el examen, revisa estos **6 puntos** (los mismos errores que nos salieron hoy y solucionamos):

- [ ] **¿Guardaste todos los archivos con `Ctrl + S`?** (Si una pestaña tiene un circulito en el nombre en VS Code, para Node ese archivo está vacío o sin actualizar).
- [ ] **¿Todos tus `import` locales terminan en `.js`?** (Cuando presionas `Tab` en VS Code, él borra el `.js` y sale `ERR_MODULE_NOT_FOUND`).
- [ ] **¿En `database.js` pusiste la contraseña de TU PC (`123`)?** (Si dejas la del profesor, sale `la autentificación password falló para el usuario postgres`).
- [ ] **¿En `app.js` importaste desde `./src/routes/...` y NO desde `./src/controllers/...`?**
- [ ] **¿Pusiste `await` antes de cada llamada a `repository.findAll()`, `findOne()`, `create()`, `update()`, `remove()`?**
- [ ] **¿En `sendResponse(..., resp)` pasaste `resp` al final (y no `req`)?**
