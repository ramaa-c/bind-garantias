import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ChannelProvider } from "./context/ChannelContext";
import { Toaster } from "sonner";
import DashboardLayout from "./components/layout/DashboardLayout/DashboardLayout";
import OnboardingGuard from "./components/guards/OnboardingGuard/OnboardingGuard";
import AdminGuard from "./components/guards/AdminGuard/AdminGuard";
import GuestGuard from "./components/guards/GuestGuard/GuestGuard";
import SessionTimeoutManager from "./components/guards/SessionTimeoutManager/SessionTimeoutManager";
import AdminLayout from "./components/layout/Admin/AdminLayout/AdminLayout";
import TenantLayout from "./components/layout/TenantLayout/TenantLayout";
import RootRedirect from "./components/layout/RootRedirect/RootRedirect";
import LoadingScreen from "./components/ui/LoadingScreen/LoadingScreen";
import "./components/ui/CustomScroll/Scroll.module.css";
import "./App.css";

const Login = lazy(() => import("./pages/cliente/auth/Login"));
const LoginAdmin = lazy(() => import("./pages/admin/auth/LoginAdmin"));
const Registro = lazy(() => import("./pages/cliente/auth/Registro"));
const CrearClave = lazy(() => import("./pages/cliente/auth/CrearClave"));
const ConfirmarCorreo = lazy(
  () => import("./pages/cliente/auth/ConfirmarCorreo"),
);
const Solicitudes = lazy(
  () => import("./pages/cliente/solicitudes/Solicitudes"),
);
const AceptarTerminos = lazy(
  () => import("./pages/cliente/auth/AceptarTerminos"),
);
const RecuperarClave = lazy(
  () => import("./pages/cliente/auth/RecuperarClave"),
);
const CadenaDetalle = lazy(
  () => import("./pages/admin/cadenas-valor/CadenaDetalle"),
);
const AltaOperacion = lazy(() =>
  import("./pages/cliente/operaciones/alta-operacion/AltaOperacion").then(
    (m) => ({ default: m.AltaOperacion }),
  ),
);
const GestionUsuarios = lazy(() =>
  import("./pages/cliente/usuarios/Gestion").then((m) => ({
    default: m.Gestion,
  })),
);
const DocumentacionView = lazy(
  () => import("./pages/cliente/operaciones/documentacion/DocumentacionView"),
);
const SociosView = lazy(
  () => import("./pages/cliente/operaciones/socios/SociosView"),
);
const NotFound = lazy(() => import("./pages/shared/NotFound/NotFound"));
const CadenaInactiva = lazy(
  () => import("./pages/shared/CadenaInactiva/CadenaInactiva"),
);
const FueraDeServicio = lazy(
  () => import("./pages/shared/FueraDeServicio/FueraDeServicio"),
);
const AltaDatosEmpresa = lazy(
  () => import("./pages/cliente/onboarding/AltaDatosEmpresa/AltaDatosEmpresa"),
);
const SeleccionarEmpresa = lazy(
  () =>
    import("./pages/cliente/onboarding/SeleccionarEmpresa/SeleccionarEmpresa"),
);
const EstadoSolicitud = lazy(
  () => import("./pages/cliente/onboarding/EstadoSolicitud/EstadoSolicitud"),
);
const Dashboard = lazy(() => import("./pages/admin/dashboard/Dashboard"));
const Empresas = lazy(() => import("./pages/admin/empresas/Empresas"));
const EmpresaDetalle = lazy(
  () => import("./pages/admin/empresas/EmpresaDetalle"),
);
const RolesPermisos = lazy(
  () => import("./pages/admin/configuracion/RolesPermisos"),
);
const Terminos = lazy(() => import("./pages/admin/configuracion/Terminos"));
const CadenasValor = lazy(
  () => import("./pages/admin/cadenas-valor/CadenasValor"),
);
const CadenasCda = lazy(() => import("./pages/admin/cadenas-valor/CadenasCda"));
const CdasGlobales = lazy(() => import("./pages/admin/cdas/CdasGlobales"));
const LineasCadena = lazy(() => import("./pages/admin/lineas/LineasCadena"));
const LineasProducto = lazy(
  () => import("./pages/admin/lineas/LineasProducto"),
);
const LineasCda = lazy(() => import("./pages/admin/lineas/LineasCda"));
const ModoOffline = lazy(
  () => import("./pages/admin/configuracion/ModoOffline"),
);

function App() {
  return (
    <BrowserRouter>
      <ChannelProvider>
        <Toaster position="top-right" richColors closeButton theme="dark" />
        <SessionTimeoutManager />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginAdmin />} />
            <Route path="/not-found" element={<NotFound />} />
            <Route path="/cadena-inactiva" element={<CadenaInactiva />} />
            <Route path="/fuera-de-servicio" element={<FueraDeServicio />} />

            <Route path="/0/:token" element={<CrearClave />} />

            <Route path="/:cadenaSlug" element={<TenantLayout />}>
              <Route index element={<Navigate to="login" replace />} />
              <Route
                path="login"
                element={
                  <GuestGuard>
                    <Login />
                  </GuestGuard>
                }
              />
              <Route
                path="ingresar"
                element={<Navigate to="../login" replace />}
              />
              <Route
                path="registro"
                element={
                  <GuestGuard>
                    <Registro />
                  </GuestGuard>
                }
              />

              <Route path="0/:token" element={<CrearClave />} />

              <Route path="confirmar-correo" element={<ConfirmarCorreo />} />
              <Route
                path="recuperar-clave"
                element={
                  <GuestGuard>
                    <RecuperarClave />
                  </GuestGuard>
                }
              />

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
              <Route
                path="socios"
                element={<Navigate to="../legajo" replace />}
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
                element={<Navigate to="../legajo" replace />}
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

              <Route
                path="terminos"
                element={
                  <OnboardingGuard>
                    <AceptarTerminos />
                  </OnboardingGuard>
                }
              />
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
              <Route
                path="estado-solicitud"
                element={
                  <OnboardingGuard>
                    <EstadoSolicitud />
                  </OnboardingGuard>
                }
              />
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
              <Route path="admin" element={<Navigate to="/admin" replace />} />
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
              path="/admin/empresas"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <Empresas />
                  </AdminLayout>
                </AdminGuard>
              }
            />
            <Route
              path="/admin/empresas/:id"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <EmpresaDetalle />
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
              path="/admin/lineas-cda"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <LineasCda />
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
            <Route
              path="/admin/modo-offline"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <ModoOffline />
                  </AdminLayout>
                </AdminGuard>
              }
            />

            {/* Redirecciones de compatibilidad para rutas legacy de admin */}
            <Route
              path="/admin/dashboard"
              element={<Navigate to="/admin" replace />}
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ChannelProvider>
    </BrowserRouter>
  );
}

export default App;
