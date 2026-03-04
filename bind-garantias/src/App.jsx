import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Registro from './pages/registro'
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal y de login */}
        <Route path="/" element={<Login />} />
        <Route path="/ingresar" element={<Login />} />
        
        {/* Ruta de registro */}
        <Route path="/registro" element={<Registro />} />

        {/* Si el usuario escribe una ruta que no existe, lo mandamos al login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;