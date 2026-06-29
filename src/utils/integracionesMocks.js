export const INTEGRACIONES_MOCKS = {
  ARCA: {
    "cuit": 20123456789,
    "estadoCuit": "ACTIVO",
    "impuestos": {
      "ganancias": "Inscripto",
      "iva": "Responsable Inscripto",
      "bienesPersonales": "Inscripto"
    },
    "deudaExigible": 0.00,
    "categoriaMonotributo": null,
    "actividadPrincipal": "Servicios de informática y programación",
    "fechaInicioActividades": "2015-05-12T00:00:00Z",
    "riesgoFiscal": "BAJO"
  },
  CASFOG: {
    "solicitudId": 98765,
    "estadoGeneral": "APROBADO",
    "montoGarantizado": 1500000.00,
    "fechaAprobacion": "2023-11-20T10:30:00Z",
    "calificacion": "A",
    "condiciones": {
      "tasa": 25.5,
      "plazoMeses": 12,
      "requiereContragarantia": false
    }
  },
  LUFE: {
    "legajoUnico": "LUFE-2023-456789",
    "estadoLegajo": "VIGENTE",
    "datosEmpresa": {
      "razonSocial": "Empresa Ficticia S.A.",
      "fechaConstitucion": "2010-02-15",
      "capitalSocial": 5000000
    },
    "socios": [
      { "nombre": "Juan Perez", "participacion": 50 },
      { "nombre": "Maria Gomez", "participacion": 50 }
    ],
    "balanceUltimoAnio": {
      "activo": 12000000,
      "pasivo": 3000000,
      "patrimonioNeto": 9000000,
      "ventasNetas": 25000000
    }
  },
  NOSIS: {
    "score": 750,
    "probabilidadDefault": 0.02,
    "peorSituacionBCRA": 1,
    "bancosConDeuda": 2,
    "montoTotalDeuda": 450000.50,
    "chequesRechazados": {
      "cantidadUltimos6Meses": 0,
      "montoUltimos6Meses": 0
    },
    "juiciosActivos": 0
  },
  SGRPLUS: {
    "socioParticipe": true,
    "limiteCreditoAsignado": 5000000.00,
    "limiteDisponible": 3500000.00,
    "garantiasVigentes": 2,
    "estadoMora": "NORMAL",
    "ultimoAvalAprobado": "2023-09-15"
  }
};
