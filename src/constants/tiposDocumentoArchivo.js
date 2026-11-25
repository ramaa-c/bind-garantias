export const DOCUMENTO_DNI_FRENTE_ID = 8;
export const DOCUMENTO_DNI_DORSO_ID = 9;

export const TIPOS_DOCUMENTO_LEGAJO = {
  estatuto: 1,
  balance: 2,
  ddjjIva: 3,
  cartasDocumento: 4,
  poderes: 5,
  certificadoPyme: 6,
  otrosDocumentos: 7,
  eecc: 10,
  actaDesignacion: 11,
  actaSocios: 12,
  f1272: 13,
  ddjjGanancias: 14,
  manifestacionBienes: 15,
  constanciaMonotributo: 16,
};

export const TIPOS_DOCUMENTO_ARCHIVO = {
  ...TIPOS_DOCUMENTO_LEGAJO,
  "socio-frente": DOCUMENTO_DNI_FRENTE_ID,
  "socio-dorso": DOCUMENTO_DNI_DORSO_ID,
};

export const IDS_DOCUMENTO_SIEMPRE_ACTIVOS = [DOCUMENTO_DNI_FRENTE_ID, DOCUMENTO_DNI_DORSO_ID];

export const IDS_DOCUMENTO_SOPORTADOS = Object.values(TIPOS_DOCUMENTO_ARCHIVO);
