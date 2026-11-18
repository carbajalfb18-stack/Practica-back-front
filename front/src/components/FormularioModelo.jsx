import { useState } from 'react';

// Recibe desde App.jsx:
// - marcas: el arreglo de marcas para llenar el <select>
// - onGuardar: la función para crear el modelo en el backend
function FormularioModelo({ marcas, onGuardar }) {

  // Paso 12: 2 variables de estado enlazadas a la caja de texto y al select
  const [nombre, setNombre] = useState('');
  const [marcaId, setMarcaId] = useState(marcas[0]?.id || 1);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que el navegador recargue la página
    await onGuardar(Number(marcaId), nombre);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Nuevo Modelo</h3>

      {/* Caja de texto para el nombre del modelo */}
      <div>
        <label>Nombre del Modelo: </label>
        <input 
          type="text" 
          value={nombre} 
          onChange={(e) => setNombre(e.target.value)} 
          required 
        />
      </div>

      {/* Paso 13: Lista desplegable (<select>) con marcas.map */}
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
