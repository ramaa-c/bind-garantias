import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import CrearClave from "./pages/CrearClave";
import ConfirmarCorreo from "./pages/ConfirmarCorreo";
import Cheques from "./pages/Cheques";
import PagareUSD from "./pages/PagareUSD";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ingresar" element={<Login />} />

        <Route path="/registro" element={<Registro />} />

        <Route path="/crear-clave" element={<CrearClave />} />
        <Route path="/confirmar-correo" element={<ConfirmarCorreo />} />

        <Route path="/cheques" element={<Cheques />} />

        <Route path="/pagare-usd" element={<PagareUSD />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
