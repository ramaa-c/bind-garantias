import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Registro from "./pages/registro";
import CrearClave from "./pages/crearClave";
import "./App.css";
import Pantalla1 from './pages/pantalla1';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ingresar" element={<Login />} />

        <Route path="/registro" element={<Registro />} />

        <Route path="/crearClave" element={<CrearClave />} />

        <Route path="/pantalla1" element={<Pantalla1/>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
