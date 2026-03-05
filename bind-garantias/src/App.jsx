import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Registro from "./pages/registro";
import CrearClave from "./pages/crearClave";
import ConfirmarCorreo from './pages/confirmarCorreo';
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ingresar" element={<Login />} />

        <Route path="/registro" element={<Registro />} />

        <Route path="/crearClave" element={<CrearClave />} />

        <Route path="/confirmarCorreo" element={<ConfirmarCorreo />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
