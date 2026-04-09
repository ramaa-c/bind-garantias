import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import CrearClave from "./pages/CrearClave";
import ConfirmarCorreo from "./pages/ConfirmarCorreo";
import Inicio from "./pages/Inicio";
import Cheques from "./pages/Cheques";
import CargaMasivaCheques from "./pages/CargaMasivaCheques";
import Prestamos from "./pages/Prestamos";
import Pagare from "./pages/Pagare";
import Solicitudes from "./pages/Solicitudes";
import SolicitudCheques from "./pages/SolicitudCheques";
import FirmaDocumento from "./pages/FirmaDocumento";
import AceptarTerminos from "./pages/AceptarTerminos";
import DashboardLayout from "./components/layout/DashboardLayout/DashboardLayout";
import "./components/ui/CustomScroll/Scroll.module.css";
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

        <Route
          path="/inicio"
          element={
            <DashboardLayout>
              <Inicio />
            </DashboardLayout>
          }
        />
        <Route
          path="/pagare"
          element={
            <DashboardLayout>
              <Pagare />
            </DashboardLayout>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <DashboardLayout>
              <Solicitudes />
            </DashboardLayout>
          }
        />
        <Route
          path="/prestamos"
          element={
            <DashboardLayout>
              <Prestamos />
            </DashboardLayout>
          }
        />
        <Route
          path="/cheques"
          element={
            <DashboardLayout>
              <Cheques />
            </DashboardLayout>
          }
        />
        <Route
          path="/solicitud-cheques"
          element={
            <DashboardLayout>
              <SolicitudCheques />
            </DashboardLayout>
          }
        />

        <Route
          path="/carga-masiva-cheques"
          element={
            <DashboardLayout>
              <CargaMasivaCheques />
            </DashboardLayout>
          }
        />

        <Route path="/firma-documento" element={<FirmaDocumento />} />

        <Route path="/terminos" element={<AceptarTerminos />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
