import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "../../styles/layout.css";

export default function DashboardLayout({ children }) {
  return (
    <div className="app-layout-root">
      
      <Navbar usuario="asesoramiento@mailinator.com" />

      <div className="app-layout-body">
        
        <Sidebar />

        <main className="app-layout-content">
          {children}
        </main>
        
      </div>
    </div>
  );
}