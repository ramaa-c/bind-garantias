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
import LoginAdmin from "./pages/admin/LoginAdmin";
import Registro from "./pages/cliente/auth/Registro";
import CrearClave from "./pages/cliente/auth/CrearClave";
import ConfirmarCorreo from "./pages/cliente/auth/ConfirmarCorreo";
import Solicitudes from "./pages/cliente/solicitudes/Solicitudes";
import AceptarTerminos from "./pages/cliente/auth/AceptarTerminos";
import RecuperarClave from "./pages/cliente/auth/RecuperarClave";
import PosicionConsolidada from "./pages/legacy/posicion-consolidada/PosicionConsolidada";
import CadenaDetalle from "./pages/admin/cadenas-valor/CadenaDetalle";
import DashboardLayout from "./components/layout/DashboardLayout/DashboardLayout";
import { AltaOperacion } from "./pages/cliente/operaciones/alta-operacion/AltaOperacion";
import { Gestion as GestionUsuarios } from "./pages/cliente/usuarios/Gestion";
import DocumentacionView from "./pages/cliente/operaciones/documentacion/DocumentacionView";
import SociosView from "./pages/cliente/operaciones/socios/SociosView";
import NotFound from "./pages/shared/NotFound/NotFound";
import CadenaInactiva from "./pages/shared/CadenaInactiva/CadenaInactiva";
import OnboardingGuard from "./components/guards/OnboardingGuard/OnboardingGuard";
import AdminGuard from "./components/guards/AdminGuard/AdminGuard";
import AltaDatosEmpresa from "./pages/cliente/onboarding/AltaDatosEmpresa/AltaDatosEmpresa";
import SeleccionarEmpresa from "./pages/cliente/onboarding/SeleccionarEmpresa/SeleccionarEmpresa";
import AdminLayout from "./components/layout/Admin/AdminLayout/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";

import RolesPermisos from "./pages/admin/RolesPermisos";
import Terminos from "./pages/admin/Terminos";
import CadenasValor from "./pages/admin/CadenasValor";
import CadenasCda from "./pages/admin/CadenasCda";
import CdasGlobales from "./pages/admin/CdasGlobales";
import LineasCadena from "./pages/admin/LineasCadena";
import LineasProducto from "./pages/admin/LineasProducto";
import TenantLayout from "./components/layout/TenantLayout/TenantLayout";
import RootRedirect from "./components/layout/RootRedirect/RootRedirect";
import "./components/ui/CustomScroll/Scroll.module.css";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <ChannelProvider>
        <Toaster position="top-right" richColors closeButton theme="dark" />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginAdmin />} />
          <Route path="/not-found" element={<NotFound />} />
          <Route path="/cadena-inactiva" element={<CadenaInactiva />} />

          <Route path="/0/:token" element={<CrearClave />} />

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
              element={<Navigate to="legajo" replace />}
            />

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

            {/* Redirecciones de admin a rutas globales */}
            <Route
              path="admin"
              element={<Navigate to="/admin" replace />}
            />
            <Route
              path="admin/dashboard"
              element={<Navigate to="/admin" replace />}
            />

            <Route
              path="admin/roles-permisos"
              element={<Navigate to="/admin/roles-permisos" replace />}
            />
            <Route
              path="admin/terminos"
              element={<Navigate to="/admin/terminos" replace />}
            />
            <Route
              path="admin/cadenas-valor"
              element={<Navigate to="/admin/cadenas-valor" replace />}
            />
            <Route
              path="admin/lineas-productos"
              element={<Navigate to="/admin/lineas-productos" replace />}
            />
          </Route>

          {/* Rutas de Administración Globales */}
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </AdminGuard>
            }
          />

          <Route
            path="/admin/roles-permisos"
            element={
              <AdminGuard>
                <AdminLayout>
                  <RolesPermisos />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/terminos"
            element={
              <AdminGuard>
                <AdminLayout>
                  <Terminos />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/cadenas-valor"
            element={
              <AdminGuard>
                <AdminLayout>
                  <CadenasValor />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/cadenas-cda"
            element={
              <AdminGuard>
                <AdminLayout>
                  <CadenasCda />
                </AdminLayout>
              </AdminGuard>
            }
          />

          <Route
            path="/admin/cdas"
            element={
              <AdminGuard>
                <AdminLayout>
                  <CdasGlobales />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/lineas-productos"
            element={
              <AdminGuard>
                <AdminLayout>
                  <LineasProducto />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/lineas-cadenas"
            element={
              <AdminGuard>
                <AdminLayout>
                  <LineasCadena />
                </AdminLayout>
              </AdminGuard>
            }
          />

          {/* Redirecciones de compatibilidad para rutas legacy de admin */}
          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ChannelProvider>
    </BrowserRouter>
  );
}

export default App;
