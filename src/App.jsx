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
import CargaMasivaCheques from "./pages/cliente/operaciones/cheques/CargaMasivaCheques";
import Prestamos from "./pages/cliente/operaciones/prestamos/Prestamos";
import PrestamosSeleccionables from "./pages/cliente/operaciones/prestamos/PrestamosSeleccionables";
import PrestamosFijos from "./pages/cliente/operaciones/prestamos/PrestamosFijos";
import Pagare from "./pages/cliente/operaciones/pagares/Pagare";
import SolicitudPagare from "./pages/cliente/operaciones/pagares/SolicitudPagare";
import Solicitudes from "./pages/cliente/solicitudes/Solicitudes";
import SolicitudCheques from "./pages/cliente/operaciones/cheques/SolicitudCheques";
import FirmaDocumento from "./pages/cliente/operaciones/pagares/FirmaDocumento";
import AceptarTerminos from "./pages/cliente/auth/AceptarTerminos";
import RecuperarClave from "./pages/cliente/auth/RecuperarClave";
import PosicionConsolidada from "./pages/legacy/posicion-consolidada/PosicionConsolidada";
import CadenaDetalle from "./pages/admin/cadenas-valor/CadenaDetalle";
import DashboardLayout from "./components/layout/DashboardLayout/DashboardLayout";
import { PantallaGestionSocios } from "./components/features";
import { AltaOperacion } from "./pages/cliente/operaciones/alta-operacion/AltaOperacion";
import { PantallaGestionUsuarios } from "./pages/cliente/usuarios/PantallaGestionUsuarios";
import DocumentacionView from "./pages/cliente/operaciones/documentacion/DocumentacionView";
import NotFound from "./pages/shared/NotFound/NotFound";
import OnboardingGuard from "./components/layout/OnboardingGuard/OnboardingGuard";
import AdminGuard from "./components/layout/AdminGuard/AdminGuard";
import AltaDatosEmpresa from "./pages/cliente/onboarding/AltaDatosEmpresa/AltaDatosEmpresa";
import AdminLayout from "./components/layout/AdminLayout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTasasMontos from "./pages/admin/AdminTasasMontos";
import AdminRolesPermisos from "./pages/admin/AdminRolesPermisos";
import AdminTerminos from "./pages/admin/AdminTerminos";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminCadenasValor from "./pages/admin/AdminCadenasValor";
import "./components/ui/CustomScroll/Scroll.module.css";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <ChannelProvider>
        <Toaster position="top-right" richColors closeButton theme="dark" />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/ingresar" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          <Route path="/:canal/0/:token" element={<CrearClave />} />

          <Route path="/confirmar-correo" element={<ConfirmarCorreo />} />
          <Route path="/recuperar-clave" element={<RecuperarClave />} />

          <Route
            path="/socios"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <PantallaGestionSocios />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/usuarios"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <PantallaGestionUsuarios />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/documentacion"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <DocumentacionView />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/inicio"
            element={<Navigate to="/solicitudes" replace />}
          />
          <Route
            path="/pagare"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <Pagare />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/solicitud-pagare"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <SolicitudPagare />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/solicitudes"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <Solicitudes />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/prestamos"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <Prestamos />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/prestamos-seleccionables"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <PrestamosSeleccionables />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/prestamos-fijos"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <PrestamosFijos />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/cheques"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <Cheques />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/solicitud-cheques"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <SolicitudCheques />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/carga-masiva-cheques"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <CargaMasivaCheques />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route path="/firma-documento" element={<FirmaDocumento />} />
          <Route path="/terminos" element={<AceptarTerminos />} />
          <Route
            path="/alta-datos-empresa"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <AltaDatosEmpresa />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/posicion-consolidada"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <PosicionConsolidada />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/cadenas-valor/:id"
            element={
              <OnboardingGuard>
                <DashboardLayout>
                  <CadenaDetalle />
                </DashboardLayout>
              </OnboardingGuard>
            }
          />
          <Route
            path="/alta-operacion"
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
            path="/admin/dashboard"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/tasas-montos"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminTasasMontos />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/roles-permisos"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminRolesPermisos />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/terminos"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminTerminos />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/banners"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminBanners />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/cadenas-valor"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminCadenasValor />
                </AdminLayout>
              </AdminGuard>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ChannelProvider>
    </BrowserRouter>
  );
}

export default App;
