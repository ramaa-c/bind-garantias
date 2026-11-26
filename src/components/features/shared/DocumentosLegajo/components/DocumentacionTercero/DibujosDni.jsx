import React from "react";

// Dibujos chicos (32×24) para las filas de DNI: el frente con la foto de la
// persona, el dorso con las líneas de texto y la banda del código - así se
// distinguen de un vistazo sin leer el título. Los usan SocioAccionistaModal
// y la documentación de cualquier tercero.
export const DibujoDniFrente = () => (
  <svg viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <rect x="1" y="1" width="30" height="22" rx="4" />
    <circle cx="9.5" cy="9.5" r="3" />
    <path d="M4.5 18.5c.8-2.4 2.8-3.6 5-3.6s4.2 1.2 5 3.6" />
    <path d="M18 8h9M18 12h7M18 16h5" />
  </svg>
);

export const DibujoDniDorso = () => (
  <svg viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <rect x="1" y="1" width="30" height="22" rx="4" />
    <path d="M5 8h22M5 12h18M5 15h14" />
    <rect x="5" y="18" width="22" height="3" rx="1" strokeWidth="1.2" />
  </svg>
);
