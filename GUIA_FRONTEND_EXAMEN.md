# 📗 Guía Definitiva de Frontend (React) para el Examen

Esta guía resume **paso a paso** toda la **Parte 2 (Frontend en React)** de la práctica dirigida, explicando de forma directa las partes más importantes de tu código, cómo se conecta con el Backend (`http://localhost:3005`), el formulario con renderizado condicional y todos los errores que corregimos.

---

## 1. Mapa de la Arquitectura Frontend (¿Cómo viajan los datos en React?)

```
1. main.jsx ────────► Envuelve toda la app con <MarcaProvider> y <ModeloProvider>
       │
       ▼
2. App.jsx ─────────► Usa useState([]), useEffect(..., []) y dibuja las 2 tablas con .map()
       │
       ├──► (Al dar clic en AGREGAR MODELO) ──► 3. components/FormularioModelo.jsx (Input + Select)
       │
       ▼  Llama a useMarca() y useModelo()
4. src/context/ (MarcaContext.jsx y ModeloContext.jsx) ──► Tienen findAll() y create()
       │
       ▼  Llama a base.get('/marcas') o base.post('/modelos', ...)
5. src/services/base.js ──► Usa fetch() para comunicarse con http://localhost:3005 (Tu Backend)
```

---

## 2. Explicación Directa de Cada Archivo y su Código Completo

### Paso 2: El Servicio Base de Peticiones (`src/services/base.js`)

Es el encargado de usar `fetch` para hablar con tu Backend (`http://localhost:3005`). Reemplaza lo que hacías manualmente en `pruebas.http`.

```javascript
const BASE_URL = 'http://localhost:3005'

const request = async (method, path, body) => {
    const headers = { 'Content-Type': 'application/json' };

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    let data = null;
    const text = await res.text();

    if (text) {
        data = JSON.parse(text);
    }

    if (!res.ok) {
        const error = new Error(data?.message || `HTTP ${res.status}`);
        throw error;
    }
    return data;
}

const base = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path)
}

export default base;
```

#### 🧠 Lo más importante que debes saber de `base.js`:
- **`BASE_URL`**: Tiene la dirección y puerto de tu Backend (`3005`).
- **`JSON.stringify(body)`**: Cuando haces un `POST`, convierte tu objeto de JS en texto JSON para enviarlo al backend.
- **`JSON.parse(text)`**: Convierte el texto JSON que responde el backend en un arreglo/objeto de JS para que React lo pueda usar en `.map()`.

> **🚨 Error crítico que corregimos en `base.js`:**
> Nunca olvides poner **`await`** antes de `fetch(...)` (línea 6) y **`await`** antes de `res.text()` (línea 13). Si olvidas el `await`, `res` y `text` quedan como Promesas vacías y todas las peticiones lanzan error.

---

### Paso 3: Los Contextos (`MarcaContext.jsx` y `ModeloContext.jsx`)

Son los "Repositorios del Frontend": guardan las funciones `findAll()` y `create()` y las comparten con toda la aplicación.

```jsx
// src/context/ModeloContext.jsx
import base from "../services/base.js";
import { useContext, createContext } from "react";

const ModeloContext = createContext(null);

export const ModeloProvider = ({ children }) => {
    const findAll = async () => {
        return await base.get('/modelos');
    }

    const create = async (marcaId, nombre) => {
        return await base.post('/modelos', { marcaId, nombre });
    }

    return (
        <ModeloContext.Provider value={{ findAll, create }}>
            {children}
        </ModeloContext.Provider>
    );
};

export const useModelo = () => useContext(ModeloContext);
export default ModeloContext;
```

#### 🧠 Lo más importante que debes saber de los Contextos:
Cada archivo de contexto exporta **2 cosas clave**:
1. **`ModeloProvider` / `MarcaProvider`**: El componente "envoltorio" que se coloca en `main.jsx` para dar acceso a los datos.
2. **`useModelo` / `useMarca`**: El hook (atajo) que llamas dentro de `App.jsx` para poder usar `.findAll()` y `.create()`.

> **⚠️ 3 errores de escritura que corregimos aquí y debes vigilar en el examen:**
> 1. **`children` siempre va todo en minúscula (`{ children }`)**: Si escribes `{ Children }` con `C` mayúscula, React falla porque `Children` en mayúscula es una utilidad interna de React y no los componentes hijos.
> 2. **El nombre del contexto debe ser idéntico en todo el archivo**: Si arriba creas `const ModeloContext = createContext(null)`, abajo en la etiqueta debes escribir `<ModeloContext.Provider>` (no mezclar singular `ModeloContext` con plural `ModelosContext`).
> 3. **Cuidado con el nombre del Provider**: Debe coincidir letra por letra con cómo lo importas en `main.jsx` (`export const ModeloProvider`).

---

### Conectar los Contextos en `src/main.jsx`

Para que `App.jsx` pueda usar `useMarca()` y `useModelo()`, en `main.jsx` debes envolver la aplicación con `<MarcaProvider>` y `<ModeloProvider>`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './index.css'
import App from './App.jsx'

import { MarcaProvider } from './context/MarcaContext.jsx'
import { ModeloProvider } from './context/ModeloContext.jsx'

const router = createBrowserRouter([
  {
    element: <App></App>,
    path: '/'
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MarcaProvider>
        <ModeloProvider>
          <RouterProvider router={router} />
        </ModeloProvider>
    </MarcaProvider>
  </StrictMode>,
)
```

---

### Pasos 4 al 10 y 14-15: La Página Principal (`src/App.jsx`)

Aquí tienes el `App.jsx` completo (incluyendo la conexión con el botón `AGREGAR MODELO` y el formulario de los Pasos 14 y 15):

```jsx
import './App.css';
import { useState, useEffect } from 'react';
import { useMarca } from './context/MarcaContext.jsx';
import { useModelo } from './context/ModeloContext.jsx';
import FormularioModelo from './components/FormularioModelo.jsx';

function App() {
  // 1. Traemos las funciones findAll() y create() de nuestros contextos
  const marcasApi = useMarca();
  const modelosApi = useModelo();

  // 2. Variables de estado (useState) para guardar las listas y si el formulario es visible
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);

  // 3. useEffect con [] al final: se ejecuta UNA sola vez al cargar la página
  useEffect(() => {
    const handleload = async () => {
      const rawMarcas = await marcasApi.findAll();
      setMarcas([...rawMarcas]);

      const rawModelos = await modelosApi.findAll();
      setModelos([...rawModelos]); // ¡OJO! Asegúrate de pasar rawModelos aquí y no rawMarcas
    }
    handleload();
  }, []);

  // 4. Función para guardar un nuevo modelo desde el formulario (Pasos 14 y 15)
  const handleGuardarModelo = async (marcaId, nombre) => {
    await modelosApi.create(marcaId, nombre);      // Guarda en PostgreSQL vía Backend
    const rawModelos = await modelosApi.findAll(); // Recarga la lista actualizada
    setModelos([...rawModelos]);
    setMostrarForm(false);                         // Oculta el formulario
  };

  return (
    <>
      <h1>Mantenimiento de Marcas y Modelos</h1>
      <h2>Lista de Marcas</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Pais</th>
          </tr>
        </thead>
        <tbody>
          {
            marcas && marcas.map(m => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>{m.nombre}</td>
                <td>{m.pais}</td>
              </tr>
            ))
          }
        </tbody>
      </table>

      <h2>Lista de Modelos</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Marca</th>
          </tr>
        </thead>
        <tbody>
          {
            modelos && modelos.map(m => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>{m.nombre}</td>
                <td>{m.marca.nombre}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
      <br/>

      {/* Paso 14: Al hacer clic cambia mostrarForm a true */}
      <button onClick={() => setMostrarForm(true)}>AGREGAR MODELO</button>

      {/* Paso 14: Renderizado condicional (solo se muestra si mostrarForm es true) */}
      {
        mostrarForm && (
          <FormularioModelo 
            marcas={marcas} 
            onGuardar={handleGuardarModelo} 
          />
        )
      }
    </>
  );
}

export default App;
```

#### 🧠 Lo más importante que debes entender de `App.jsx`:
1. **`useState([])`**: Crea variables reactivas (`marcas`, `modelos`). Cuando las actualizas con `setMarcas(...)` o `setModelos(...)`, React vuelve a dibujar la tabla en pantalla automáticamente.
2. **`useEffect(() => { ... }, [])`**: El arreglo vacío `[]` al final indica que `handleload()` solo se ejecuta **cuando se abre la página por primera vez**.
3. **`marcas.map(m => (<tr key={m.id}>...</tr>))`**: Recorre el arreglo y transforma cada objeto en una fila `<tr>` de la tabla. Siempre lleva `key={m.id}` en la etiqueta `<tr>`.
4. **`<td>{m.marca.nombre}</td>`**: Funciona porque en el Paso 14 del Backend agregaste `include: { model: Marca }` dentro de `modelos.repositorio.js`. Así cada modelo ya trae su objeto `marca` adentro.
5. **`{ mostrarForm && <FormularioModelo ... /> }` (Renderizado condicional)**: En React, la expresión `condicion && <Componente />` dibuja el componente solo cuando `condicion` es `true`, y lo oculta cuando es `false`.

---

### Pasos 11, 12, 13 y 15: El Formulario (`src/components/FormularioModelo.jsx`)

```jsx
import { useState } from 'react';

function FormularioModelo({ marcas, onGuardar }) {
  // Paso 12: 2 variables de estado para los 2 campos del formulario
  const [nombre, setNombre] = useState('');
  const [marcaId, setMarcaId] = useState(marcas[0]?.id || 1);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que el navegador recargue la página al enviar el form
    await onGuardar(Number(marcaId), nombre);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Nuevo Modelo</h3>

      <div>
        <label>Nombre del Modelo: </label>
        <input 
          type="text" 
          value={nombre} 
          onChange={(e) => setNombre(e.target.value)} 
          required 
        />
      </div>

      {/* Paso 13: Dropdown (<select>) que carga las marcas con .map */}
      <div>
        <label>Marca: </label>
        <select 
          value={marcaId} 
          onChange={(e) => setMarcaId(e.target.value)}
        >
          {
            marcas && marcas.map(m => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))
          }
        </select>
      </div>

      <br />
      <button type="submit">Guardar</button>
    </form>
  );
}

export default FormularioModelo;
```

#### 🧠 Lo más importante que debes entender del Formulario:
- **Cómo funciona un `<input>` en React**: Se enlaza con dos propiedades: `value={nombre}` (muestra lo que vale la variable) y `onChange={(e) => setNombre(e.target.value)}` (actualiza la variable cada vez que escribes una letra).
- **Cómo funciona un `<select>` dinámico (Paso 13)**: Adentro del `<select>` usas `marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)`. El usuario ve en pantalla `{m.nombre}` (ej. `"Mitsubishi"`), pero cuando lo selecciona, lo que se guarda en `value` es `{m.id}` (ej. `3`).

---

## 3. Comandos de Terminal y Git (Para no fallar al correr o guardar el proyecto)

### 🖥️ 1. ¿Por qué salía `npm error enoent Could not read package.json`?
Porque la terminal estaba ubicada en la carpeta raíz `REPASO-EXAMEN`, donde no hay ningún `package.json`.
Siempre debes abrir **2 terminales** y entrar a cada subcarpeta con `cd`:

- **Terminal 1 (Backend - Puerto 3005):**
  ```bash
  cd backend
  npm install
  npm run dev
  ```
- **Terminal 2 (Frontend - Puerto 5173):**
  ```bash
  cd front
  npm install
  npm run dev
  ```

### 📦 2. Cómo hacer Commit en Git sin subir `node_modules`
1. Verifica que exista el archivo `.gitignore` con:
   ```gitignore
   node_modules/
   **/node_modules/
   dist/
   .env
   ```
2. En la terminal (en `REPASO-EXAMEN`), ejecuta:
   ```bash
   git init
   git add .
   git status
   git commit -m "Proyecto completo backend y frontend"
   ```
   *(Si alguna vez hiciste `git add .` antes de crear el `.gitignore`, limpia la caché con `git rm -r --cached backend/node_modules front/node_modules` antes del commit).*
