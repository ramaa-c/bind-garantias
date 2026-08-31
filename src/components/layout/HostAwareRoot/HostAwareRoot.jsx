import React, { lazy, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import TenantLayout from "../TenantLayout/TenantLayout";
import AdminLayout from "../Admin/AdminLayout/AdminLayout";
import GuestGuard from "../../guards/GuestGuard/GuestGuard";
import AdminGuard from "../../guards/AdminGuard/AdminGuard";
import LoadingScreen from "../../ui/LoadingScreen/LoadingScreen";

const Login = lazy(() => import("../../../pages/cliente/auth/Login"));
const Dashboard = lazy(() => import("../../../pages/admin/dashboard/Dashboard"));
const NotFound = lazy(() => import("../../../pages/shared/NotFound/NotFound"));

// Dominios que enmascaran una ruta interna en la raíz "/": el navegador se
// queda mostrando este hostname, pero react-router matchea internamente
// contra la "location" indicada acá vía <Routes location=...> — nunca con
// navigate()/<Navigate>, que rompería el enmascarado que hacen en el
// entorno del banco (ver comentario en App.jsx, Victor 2026-08-21).
//
// El mapeo sale de /mascaras.json (carpeta public/, se copia tal cual al
// build) en vez de estar hardcodeado acá: así se puede cambiar qué hostname
// enmascara qué cadena editando ese archivo directo en el servidor IIS, sin
// rebuildear ni tocar código.
const HostAwareRoot = () => {
  const [mascaras, setMascaras] = useState(null);

  useEffect(() => {
    let cancelado = false;
    fetch("/mascaras.json", { cache: "no-cache" })
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}))
      .then((data) => {
        if (!cancelado) setMascaras(data || {});
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (mascaras === null) {
    return <LoadingScreen />;
  }

  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const mascara = mascaras[hostname];

  if (mascara?.tipo === "admin") {
    return (
      <Routes location="/admin">
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
      </Routes>
    );
  }

  if (mascara?.tipo === "cliente" && mascara.cadenaSlug) {
    return (
      <Routes location={`/${mascara.cadenaSlug}/login`}>
        <Route path=":cadenaSlug" element={<TenantLayout />}>
          <Route
            path="login"
            element={
              <GuestGuard>
                <Login />
              </GuestGuard>
            }
          />
        </Route>
      </Routes>
    );
  }

  return <NotFound />;
};

export default HostAwareRoot;
