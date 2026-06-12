import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ChannelProvider } from "./context/ChannelContext";
import { Toaster } from "sonner";
import Login from "./pages/cliente/auth/Login";
import Registro from "./pages/cliente/auth/Registro";
import CrearClave from "./pages/cliente/auth/CrearClave";
import ConfirmarCorreo from "./pages/cliente/auth/ConfirmarCorreo";
import Inicio from "./pages/legacy/dashboard/Inicio";
import Cheques from "./pages/cliente/operaciones/cheques/Cheques";
import CargaMasiva from "./pages/cliente/operaciones/cheques/CargaMasiva";
import Prestamos from "./pages/cliente/operaciones/prestamos/Prestamos";
import PrestamosSeleccionables from "./pages/cliente/operaciones/prestamos/PrestamosSeleccionables";
import PrestamosFijos from "./pages/cliente/operaciones/prestamos/PrestamosFijos";
import Pagare from "./pages/cliente/operaciones/pagares/Pagare";
import SolicitudPagare from "./pages/cliente/operaciones/pagares/SolicitudPagare";
import Solicitudes from "./pages/cliente/solicitudes/Solicitudes";
import Solicitud from "./pages/cliente/operaciones/cheques/Solicitud";
import FirmaDocumento from "./pages/cliente/operaciones/pagares/FirmaDocumento";
import AceptarTerminos from "./pages/cliente/auth/AceptarTerminos";
import RecuperarClave from "./pages/cliente/auth/RecuperarClave";
import PosicionConsolidada from "./pages/legacy/posicion-consolidada/PosicionConsolidada";
import CadenaDetalle from "./pages/admin/cadenas-valor/CadenaDetalle";
import DashboardLayout from "./components/layout/DashboardLayout/DashboardLayout";
import { Gestion as GestionSocios } from "./components/features";
import { AltaOperacion } from "./pages/cliente/operaciones/alta-operacion/AltaOperacion";
import { Gestion as GestionUsuarios } from "./pages/cliente/usuarios/Gestion";
import DocumentacionView from "./pages/cliente/operaciones/documentacion/DocumentacionView";
import SociosView from "./pages/cliente/operaciones/socios/SociosView";
import NotFound from "./pages/shared/NotFound/NotFound";
import OnboardingGuard from "./components/guards/OnboardingGuard/OnboardingGuard";
import AdminGuard from "./components/guards/AdminGuard/AdminGuard";
import AltaDatosEmpresa from "./pages/cliente/onboarding/AltaDatosEmpresa/AltaDatosEmpresa";
import SeleccionarEmpresa from "./pages/cliente/onboarding/SeleccionarEmpresa/SeleccionarEmpresa";
import AdminLayout from "./components/layout/Admin/AdminLayout/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import TasasMontos from "./pages/admin/TasasMontos";
import RolesPermisos from "./pages/admin/RolesPermisos";
import Terminos from "./pages/admin/Terminos";
import Banners from "./pages/admin/Banners";
import CadenasValor from "./pages/admin/CadenasValor";
import TenantLayout from "./components/layout/TenantLayout/TenantLayout";
import "./components/ui/CustomScroll/Scroll.module.css";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <ChannelProvider>
        <Toaster position="top-right" richColors closeButton theme="dark" />
        <Routes>
          <Route path="/" element={<Navigate to="/default/login" replace />} />

          <Route path="/:cadenaSlug" element={<TenantLayout />}>
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="ingresar" element={<Navigate to="login" replace />} />
            <Route path="registro" element={<Registro />} />

            <Route path="0/:token" element={<CrearClave />} />

            <Route path="confirmar-correo" element={<ConfirmarCorreo />} />
            <Route path="recuperar-clave" element={<RecuperarClave />} />

            <Route
              path="legajo"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <SociosView />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route path="socios" element={<Navigate to="legajo" replace />} />
            <Route
              path="gestion-socios"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <GestionSocios />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route
              path="usuarios"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <GestionUsuarios />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route
              path="documentacion"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <DocumentacionView />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route
              path="inicio"
              element={<Navigate to="solicitudes" replace />}
            />
{/*
            <Route
              path="pagare"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <Pagare />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route
              path="solicitud-pagare"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <SolicitudPagare />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            */}
            <Route
              path="solicitudes"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <Solicitudes />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
{/*
            <Route
              path="prestamos"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <Prestamos />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route
              path="prestamos-seleccionables"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <PrestamosSeleccionables />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route
              path="prestamos-fijos"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <PrestamosFijos />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route
              path="cheques"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <Cheques />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route
              path="solicitud-cheques"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <Solicitud />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route
              path="carga-masiva-cheques"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <CargaMasiva />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route path="firma-documento" element={<FirmaDocumento />} />
            */}
            <Route path="terminos" element={<AceptarTerminos />} />
            <Route
              path="alta-datos-empresa"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <AltaDatosEmpresa />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route
              path="seleccionar-empresa"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <SeleccionarEmpresa />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
{/*
            <Route
              path="posicion-consolidada"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <PosicionConsolidada />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            */}
            <Route
              path="cadenas-valor/:id"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <CadenaDetalle />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />
            <Route
              path="alta-operacion"
              element={
                <OnboardingGuard>
                  <DashboardLayout>
                    <AltaOperacion />
                  </DashboardLayout>
                </OnboardingGuard>
              }
            />

            {/* Rutas de Administración */}
            <Route
              path="admin/dashboard"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </AdminGuard>
              }
            />
            <Route
              path="admin/tasas-montos"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <TasasMontos />
                  </AdminLayout>
                </AdminGuard>
              }
            />
            <Route
              path="admin/roles-permisos"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <RolesPermisos />
                  </AdminLayout>
                </AdminGuard>
              }
            />
            <Route
              path="admin/terminos"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <Terminos />
                  </AdminLayout>
                </AdminGuard>
              }
            />
            <Route
              path="admin/banners"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <Banners />
                  </AdminLayout>
                </AdminGuard>
              }
            />
            <Route
              path="admin/cadenas-valor"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <CadenasValor />
                  </AdminLayout>
                </AdminGuard>
              }
            />
          </Route>

          {/* Redirecciones de compatibilidad para rutas legacy de admin */}
          <Route path="/admin" element={<Navigate to="/default/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<Navigate to="/default/admin/dashboard" replace />} />
          <Route path="/admin/tasas-montos" element={<Navigate to="/default/admin/tasas-montos" replace />} />
          <Route path="/admin/roles-permisos" element={<Navigate to="/default/admin/roles-permisos" replace />} />
          <Route path="/admin/terminos" element={<Navigate to="/default/admin/terminos" replace />} />
          <Route path="/admin/banners" element={<Navigate to="/default/admin/banners" replace />} />
          <Route path="/admin/cadenas-valor" element={<Navigate to="/default/admin/cadenas-valor" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ChannelProvider>
    </BrowserRouter>
  );
}

export default App;
