export const INTEGRACIONES_MOCKS = {
  ARCA: {
    "datosgenerales": {
      "apellido": "string",
      "caracterizacion": [
        {
          "descripcioncaracterizacion": "string",
          "idcaracterizacion": 0,
          "periodo": 0
        }
      ],
      "dependencia": {
        "codpostal": "string",
        "descripciondependencia": "string",
        "descripcionprovincia": "string",
        "direccion": "string",
        "iddependencia": 0,
        "idprovincia": 0,
        "localidad": "string"
      },
      "domiciliofiscal": {
        "codpostal": "string",
        "datoadicional": "string",
        "descripcionprovincia": "string",
        "direccion": "string",
        "idprovincia": 0,
        "localidad": "string",
        "tipodatoadicional": "string",
        "tipodomicilio": "string"
      },
      "essucesion": "string",
      "estadoclave": "string",
      "fechacontratosocial": "string",
      "fechafallecimiento": "string",
      "idpersona": 0,
      "mescierre": 0,
      "nombre": "string",
      "razonsocial": "string",
      "tipoclave": "string",
      "tipopersona": "string"
    },
    "datosmonotributo": {
      "actividad": [
        {
          "descripcionactividad": "string",
          "idactividad": 0,
          "nomenclador": 0,
          "orden": 0,
          "periodo": 0
        }
      ],
      "actividadmonotributista": {
        "descripcionactividad": "string",
        "idactividad": 0,
        "nomenclador": 0,
        "orden": 0,
        "periodo": 0
      },
      "categoriamonotributo": {
        "descripcioncategoria": "string",
        "idcategoria": 0,
        "idimpuesto": 0,
        "periodo": 0
      },
      "componentedesociedad": [
        {
          "apellidopersonaasociada": "string",
          "ffrelacion": "string",
          "ffvencimiento": "string",
          "idpersonaasociada": 0,
          "nombrepersonaasociada": "string",
          "razonsocialpersonaasociada": "string",
          "tipocomponente": "string"
        }
      ],
      "impuesto": [
        {
          "descripcionimpuesto": "string",
          "estadoimpuesto": "string",
          "idimpuesto": 0,
          "motivo": "string",
          "periodo": 0
        }
      ]
    },
    "datosregimengeneral": {
      "actividad": [
        {
          "descripcionactividad": "string",
          "idactividad": 0,
          "nomenclador": 0,
          "orden": 0,
          "periodo": 0
        }
      ],
      "categoriaautonomo": {
        "descripcioncategoria": "string",
        "idcategoria": 0,
        "idimpuesto": 0,
        "periodo": 0
      },
      "impuesto": [
        {
          "descripcionimpuesto": "string",
          "estadoimpuesto": "string",
          "idimpuesto": 0,
          "motivo": "string",
          "periodo": 0
        }
      ],
      "regimen": [
        {
          "descripcionregimen": "string",
          "idimpuesto": 0,
          "idregimen": 0,
          "periodo": 0,
          "tiporegimen": "string"
        }
      ]
    },
    "errorconstancia": {
      "apellido": "string",
      "error": [
        "string"
      ],
      "idpersona": 0,
      "nombre": "string"
    },
    "errormonotributo": {
      "error": [
        "string"
      ],
      "mensaje": "string"
    },
    "errorregimengeneral": {
      "error": [
        "string"
      ],
      "mensaje": "string"
    },
    "metadata": {
      "fechahora": "string",
      "servidor": "string"
    }
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
    "success": true,
    "cuit": 0,
    "nombre": "string",
    "actividad_principal": 0,
    "forma_juridica": "string",
    "fecha_contrato_social": "string",
    "personeria": "string",
    "impuestos": [
      {
        "codigo_caracterizacion": 0,
        "estado": "string",
        "origen": "string",
        "identificacion_estado_vigente": "string",
        "periodo_vigencia": 0,
        "fecha_actualizacion": "string"
      }
    ],
    "actividades": [
      {
        "codigo": 0,
        "estado": "string",
        "origen": "string",
        "vigente": "string",
        "periodo_vigencia": 0,
        "fecha_actualizacion": "string"
      }
    ],
    "certificado_pyme": {
      "categoria": "string",
      "desde": "string",
      "fecha_emision": "string",
      "hasta": "string",
      "nro_registro": 0,
      "sector": "string",
      "transaccion": 0
    },
    "contactos": [
      {
        "nombre": "string",
        "tipo": "string",
        "telefono": "string",
        "email": "string"
      }
    ],
    "fecha_modificacion": "string",
    "ultimas_modificaciones": {
      "indicadores": "string",
      "documentos": "string",
      "autoridades": "string"
    },
    "mes_cierre": 0,
    "domicilio_fiscal": "string",
    "regimenes": [
      {
        "descripcionregimen": "string",
        "estado": "string",
        "idimpuesto": 0,
        "idregimen": 0,
        "periodo": 0,
        "tiporegimen": "string"
      }
    ],
    "empleo": [
      {
        "periodo": 0,
        "fecha_present": "string",
        "numero_rectif": 0,
        "empleo": 0,
        "masa_salarial_bruta": 0
      }
    ]
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
