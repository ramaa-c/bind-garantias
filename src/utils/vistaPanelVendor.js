const CLAVE_VISTA_PANEL_VENDOR = "bind_vista_panel_vendor";
const VISTA_EMPRESAS = "empresas";

const leerVistaPanelVendor = () => {
  try {
    return window.sessionStorage.getItem(CLAVE_VISTA_PANEL_VENDOR);
  } catch {
    return null;
  }
};

export const guardarVistaPanelVendor = (vista) => {
  try {
    if (vista === VISTA_EMPRESAS) {
      window.sessionStorage.setItem(CLAVE_VISTA_PANEL_VENDOR, vista);
    } else {
      window.sessionStorage.removeItem(CLAVE_VISTA_PANEL_VENDOR);
    }
  } catch {
    return;
  }
};

export const rutaPanelVendor = (basePath, vista = leerVistaPanelVendor()) =>
  `${basePath}/seleccionar-empresa${vista === VISTA_EMPRESAS ? `?vista=${VISTA_EMPRESAS}` : ""}`;
