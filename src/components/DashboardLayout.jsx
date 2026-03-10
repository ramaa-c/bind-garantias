import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "../styles/layout.css";

export default function DashboardLayout({ children }) {
  return (
    <div className="app-layout-root">
      {/* 1. El Navbar ocupa todo el ancho superior */}
      <Navbar usuario="asesoramiento@mailinator.com" />

      {/* 2. Contenedor inferior dividido en 2 columnas */}
      <div className="app-layout-body">
        
        {/* El menú lateral fijo a la izquierda */}
        <Sidebar />

        {/* 3. El área de contenido (donde cambian las pantallas) */}
        <main className="app-layout-content">
          {children}
        </main>
        
      </div>
    </div>
  );
}