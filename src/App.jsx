import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Login from "./pages/auth/Login";
import Registro from "./pages/auth/Registro";
import CrearClave from "./pages/auth/CrearClave";
import ConfirmarCorreo from "./pages/auth/ConfirmarCorreo";
import Inicio from "./pages/dashboard/Inicio";
import Cheques from "./pages/cheques/Cheques";
import CargaMasivaCheques from "./pages/cheques/CargaMasivaCheques";
import Prestamos from "./pages/prestamos/Prestamos";
import PrestamosSeleccionables from "./pages/prestamos/PrestamosSeleccionables";
import PrestamosFijos from "./pages/prestamos/PrestamosFijos";
import Pagare from "./pages/pagares/Pagare";
import SolicitudPagare from "./pages/pagares/SolicitudPagare";
import Solicitudes from "./pages/solicitudes/Solicitudes";
import SolicitudCheques from "./pages/cheques/SolicitudCheques";
import FirmaDocumento from "./pages/pagares/FirmaDocumento";
import AceptarTerminos from "./pages/auth/AceptarTerminos";
import RecuperarPassword from "./pages/auth/RecuperarPassword";
import PosicionConsolidada from "./pages/posicion-consolidada/PosicionConsolidada";
import CadenaDetalle from "./pages/cadenas-valor/CadenaDetalle";
import DashboardLayout from "./components/layout/DashboardLayout/DashboardLayout";
import { PantallaGestionSocios } from "./components/features";
import { AltaOperacion } from "./pages/alta-operacion/AltaOperacion";
import { PantallaGestionUsuarios } from "./pages/usuarios/PantallaGestionUsuarios";
import DocumentacionView from "./pages/documentacion/DocumentacionView";
import "./components/ui/CustomScroll/Scroll.module.css";
import "./App.css";

if (typeof window !== "undefined") {
  const currentPath = window.location.pathname;
  const match = currentPath.match(/^\/([^/]+)\/crear_clave\/(.+)$/);

  if (match) {
    const [, canal, tokenFragment] = match;
    const rawToken = `${tokenFragment}${window.location.hash || ""}`;

    sessionStorage.setItem("secure_recovery_token", rawToken);
    sessionStorage.setItem("secure_recovery_canal", canal);

    window.history.replaceState(null, "", `/${canal}/crear_clave`);
  }
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton theme="dark" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ingresar" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        <Route path="/:canal/crear_clave/*" element={<CrearClave />} />

        <Route path="/confirmar-correo" element={<ConfirmarCorreo />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />

        <Route
          path="/socios"
          element={
            <DashboardLayout>
              <PantallaGestionSocios />
            </DashboardLayout>
          }
        />
        <Route
          path="/usuarios"
          element={
            <DashboardLayout>
              <PantallaGestionUsuarios />
            </DashboardLayout>
          }
        />
        <Route
          path="/documentacion"
          element={
            <DashboardLayout>
              <DocumentacionView />
            </DashboardLayout>
          }
        />
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
          path="/solicitud-pagare"
          element={
            <DashboardLayout>
              <SolicitudPagare />
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
          path="/prestamos-seleccionables"
          element={
            <DashboardLayout>
              <PrestamosSeleccionables />
            </DashboardLayout>
          }
        />
        <Route
          path="/prestamos-fijos"
          element={
            <DashboardLayout>
              <PrestamosFijos />
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
        <Route
          path="/posicion-consolidada"
          element={
            <DashboardLayout>
              <PosicionConsolidada />
            </DashboardLayout>
          }
        />
        <Route
          path="/cadenas-valor/:id"
          element={
            <DashboardLayout>
              <CadenaDetalle />
            </DashboardLayout>
          }
        />
        <Route
          path="/alta-operacion"
          element={
            <DashboardLayout>
              <AltaOperacion />
            </DashboardLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
