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
    "Contenido": {
      "Pedido": {
        "Usuario": 63288,
        "Documento": "30714430048",
        "VR": "2",
        "Timeout": 300
      },
      "Resultado": {
        "Estado": 200,
        "Novedad": "OK",
        "Tiempo": 1375,
        "FechaRecepcion": "2026-07-07T10:39:37.000-03:00",
        "Transaccion": "537bf31d-bc05-4ae1-a30a-42196d8d29c7",
        "Referencia": "30714430048",
        "Servidor": "SACWEBZ13",
        "Version": "1.3.0"
      },
      "Datos": {
        "Variables": [
          { "Nombre": "VI_RazonSocial", "Valor": "LYCOFULL SRL", "Descripcion": "Razón Social", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Apellido", "Valor": "", "Descripcion": "Apellido", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Nombre", "Valor": "", "Descripcion": "Nombre", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_DNI", "Valor": "", "Descripcion": "DNI", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Identificacion", "Valor": "30714430048", "Descripcion": "CUIT / CUIL / CDI", "Tipo": "DOCUMENTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_TipoPersona", "Valor": "1", "Descripcion": "Tipo Persona", "Tipo": "ENTERO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Fallecido_Es", "Valor": "-", "Descripcion": "Persona Fallecida", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "VI_FecNacimiento", "Valor": "", "Descripcion": "Fecha de Nacimiento", "Tipo": "FECHA", "FechaAct": null },
          { "Nombre": "VI_Edad", "Valor": "", "Descripcion": "Edad", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "VI_Sexo", "Valor": "", "Descripcion": "Género", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_DomAF_Calle", "Valor": "PATRICIAS MENDOCINAS", "Descripcion": "Calle", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_DomAF_Nro", "Valor": "248", "Descripcion": "Número", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_DomAF_Piso", "Valor": "", "Descripcion": "Piso", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_DomAF_Dto", "Valor": "", "Descripcion": "Departamento", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_DomAF_Loc", "Valor": "LA CONSULTA", "Descripcion": "Localidad", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_DomAF_CP", "Valor": "5567", "Descripcion": "Código Postal", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_DomAF_Prov", "Valor": "Mendoza", "Descripcion": "Provincia", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_DomAlt1_Calle", "Valor": "PATRICIAS MENDOCINAS", "Descripcion": "Calle", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_DomAlt1_Nro", "Valor": "", "Descripcion": "Número", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_DomAlt1_Piso", "Valor": "", "Descripcion": "Piso", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_DomAlt1_Dto", "Valor": "", "Descripcion": "Departamento", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_DomAlt1_Loc", "Valor": "", "Descripcion": "Localidad", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_DomAlt1_CP", "Valor": "0", "Descripcion": "Código postal", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_DomAlt1_Prov", "Valor": "", "Descripcion": "Provincia", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_Inscrip_Monotributo", "Valor": "", "Descripcion": "Categoría Monotributo", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_Inscrip_Monotributo_Act", "Valor": "", "Descripcion": "Actividad Monotributo", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_Inscrip_Monotributo_Fec", "Valor": "", "Descripcion": "Fecha Alta Monotributo", "Tipo": "FECHA", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Inscrip_Monotributo_Antiguedad", "Valor": "", "Descripcion": "Antigüedad Monotributo (Meses)", "Tipo": "ENTERO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Inscrip_Autonomo", "Valor": "", "Descripcion": "Categoría Autónomo", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Inscrip_Autonomo_Fec", "Valor": "", "Descripcion": "Fecha Alta Autónomo", "Tipo": "FECHA", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Inscrip_Autonomo_Antiguedad", "Valor": "", "Descripcion": "Antigüedad Autónomo (Meses)", "Tipo": "ENTERO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_IntegranteSociedad_Es", "Valor": "", "Descripcion": "Es Integrante Sociedad", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "VI_Empleador_Es", "Valor": "Si", "Descripcion": "Es Empleador", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "VI_ContratoSocial_Fec", "Valor": "2013-11-21", "Descripcion": "Fecha Contrato Social", "Tipo": "FECHA", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Inscrip_Afip_Antiguedad", "Valor": "146", "Descripcion": "Antigüedad Inscripción AFIP (meses)", "Tipo": "ENTERO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Empleados_Cant", "Valor": "4", "Descripcion": "Cantidad Empleados", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "VI_Jubilado_Es", "Valor": "", "Descripcion": "Es Jubilado", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "VI_Empleado_Es", "Valor": "", "Descripcion": "Es Empleado", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "VI_Empleador_RZ", "Valor": "", "Descripcion": "Razón Social / Nombre", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_Empleador_CUIT", "Valor": "", "Descripcion": "CUIT", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_Empleador_Empleados_Cant", "Valor": "", "Descripcion": "Cantidad Empleados", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "VI_Inscrip_IVA", "Valor": "Si", "Descripcion": "Inscripción IVA", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "VI_Inscrip_IVA_Excluido", "Valor": "No", "Descripcion": "Exclusión de la retención en IVA", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_Inscrip_IVA_Fec", "Valor": "2014-07-01", "Descripcion": "Fecha inscripción en IVA", "Tipo": "FECHA", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Inscrip_GCIA", "Valor": "Si", "Descripcion": "Inscripción ganancias", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "VI_Inscrip_Gcia_Excluido", "Valor": "No", "Descripcion": "Exclusión de la retención ganancias", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_Inscrip_Gcia_Fec", "Valor": "2014-07-01", "Descripcion": "Fecha inscripción ganancias", "Tipo": "FECHA", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Inscrip_AFIP_Fec", "Valor": "2014-04-01", "Descripcion": "Fecha impuesto más antiguo", "Tipo": "FECHA", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Act01_Cod", "Valor": "11329", "Descripcion": "Código Actividad Principal (Nº1)", "Tipo": "ENTERO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Act01_Descrip", "Valor": "Cultivo de bulbos, brotes, raíces y hortalizas de fruto n.c.p.", "Descripcion": "Descripción Actividad Principal (Nº1)", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Act01_FecInicio", "Valor": "2023-10-01", "Descripcion": "Fecha Inicio Actividad Principal (Nº1)", "Tipo": "FECHA", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Act01_Sector", "Valor": "Agropecuario", "Descripcion": "Sector Actividad Principal (Nº1)", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Act02_Cod", "Valor": "11321", "Descripcion": "Código Actividad Secundaria (Nº2)", "Tipo": "ENTERO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Act02_Descrip", "Valor": "Cultivo de tomate", "Descripcion": "Descripción Actividad Secundaria (Nº2)", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Act03_Cod", "Valor": "773010", "Descripcion": "Código Actividad Secundaria (Nº3)", "Tipo": "ENTERO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Act03_Descrip", "Valor": "Alquiler de maquinaria y equipo agropecuario y forestal, sin operarios", "Descripcion": "Descripción Actividad Secundaria (Nº3)", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "CI_Vig_PeorSit", "Valor": "1", "Descripcion": "Peor Situación", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Vig_Total_CantBcos", "Valor": "1", "Descripcion": "Cantidad Bancos", "Tipo": "ENTERO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Vig_Total_Monto", "Valor": "21222000", "Descripcion": "Monto Total", "Tipo": "MONEDA", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Antiguedad", "Valor": "126", "Descripcion": "Antigüedad BCRA (meses)", "Tipo": "ENTERO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Vig_Bco1_Sit", "Valor": "1", "Descripcion": "Bco Nº1 - Situación", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Vig_Bco2_Sit", "Valor": "0", "Descripcion": "Bco Nº2 - Situación", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Vig_Bco3_Sit", "Valor": "0", "Descripcion": "Bco Nº3 - Situación", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Vig_Bco4_Sit", "Valor": "0", "Descripcion": "Bco Nº4 - Situación", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Vig_Bco5_Sit", "Valor": "0", "Descripcion": "Bco Nº5 - Situación", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Vig_Bco6_Sit", "Valor": "0", "Descripcion": "Bco Nº6 - Situación", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Vig_Bco7_Sit", "Valor": "0", "Descripcion": "Bco Nº7 - Situación", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Vig_Bco8_Sit", "Valor": "0", "Descripcion": "Bco Nº8 - Situación", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Vig_Bco9_Sit", "Valor": "0", "Descripcion": "Bco Nº9 - Situación", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_Vig_Bco10_Sit", "Valor": "0", "Descripcion": "Bco Nº10 - Situación", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_6m_PeorSit", "Valor": "1", "Descripcion": "Peor Situación - Últ. 6 Meses", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_12m_PeorSit", "Valor": "1", "Descripcion": "Peor Situación - Últ. 12 Meses", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "CI_12m_Total_CantBcos", "Valor": "1", "Descripcion": "Cantidad bancos - Últ. 12 Meses", "Tipo": "ENTERO", "FechaAct": "2026-05-31" },
          { "Nombre": "VR_12m_Cumplimiento", "Valor": "1", "Descripcion": "Perfil Cumplimiento del Deudor", "Tipo": "ENTERO", "FechaAct": "2026-05-31" },
          { "Nombre": "DX_Es", "Valor": "No", "Descripcion": "Es moroso", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "HC_6m_SF_NoPag_Cant", "Valor": "0", "Descripcion": "Cantidad sin fondos, no pagados - Últ. 6 Meses", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "HC_6m_SF_NoPag_Monto", "Valor": "0", "Descripcion": "Monto sin fondos, no pagados - Últ. 6 Meses", "Tipo": "MONEDA", "FechaAct": null },
          { "Nombre": "JU_12m_RZ_Cant", "Valor": "0", "Descripcion": "Juicios cantidad - Últ. 12 meses", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "CQ_12m_RZ_Cant", "Valor": "0", "Descripcion": "Concursos y quiebras cantidad - Últ. 12 meses", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "SCO_Vig", "Valor": "825", "Descripcion": "Score", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "NSE", "Valor": "NC", "Descripcion": "Nivel Socioeconómico", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "FE", "Valor": "3", "Descripcion": "Facturación Estimada", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "CDA", "Valor": "Aprobado", "Descripcion": "Criterio de aceptación definido por el usuario", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_DICT", "Valor": "APROBADO", "Descripcion": "Dictamen", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_AF", "Valor": "Ok", "Descripcion": "Identidad Válida", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_VI.EDAD", "Valor": "N/C", "Descripcion": "Edad", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_VI.FCS", "Valor": "Ok", "Descripcion": "Fecha Contrato Social", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_VI.ACT", "Valor": "Ok", "Descripcion": "Actividades", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_AP", "Valor": "Ok", "Descripcion": "Aportes Patronales", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_CI", "Valor": "Ok", "Descripcion": "Bureau de Crédito del BCRA", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_OJ", "Valor": "Ok", "Descripcion": "Oficios Judiciales", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_HC", "Valor": "Ok", "Descripcion": "Cheques Rechazados del BCRA", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_DE", "Valor": "N/C", "Descripcion": "Deudores Ent. Liquidadas", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_QU.1", "Valor": "Ok", "Descripcion": "Concurso o Quiebra", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_QU.2", "Valor": "Ok", "Descripcion": "Pedido Quiebra", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_QU.3", "Valor": "Ok", "Descripcion": "Juicios - Demandado", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_BC", "Valor": "N/C", "Descripcion": "Comunicaciones del BCRA y de Fuentes Directas", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_RC.P", "Valor": "Ok", "Descripcion": "Referencias Comerciales Propias", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_RC.T", "Valor": "Ok", "Descripcion": "Referencias Comerciales de Terceros", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_FA", "Valor": "Ok", "Descripcion": "Facturas Apócrifas", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_LD", "Valor": "Ok", "Descripcion": "Laudos Incumplidos", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_DF", "Valor": "N/C", "Descripcion": "Antecedentes Fiscales", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_DC", "Valor": "N/C", "Descripcion": "Documentos Cuestionados", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_DP", "Valor": "N/C", "Descripcion": "Deudores Previsionales", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_SCO", "Valor": "Ok", "Descripcion": "Score", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_Valor.SCO", "Valor": "825", "Descripcion": "Score", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_NSE", "Valor": "N/C", "Descripcion": "Facturacion Estimada", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_Valor.NSE", "Valor": "3", "Descripcion": "Facturacion Estimada", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CDA_COMPMENSUALES", "Valor": "1805333", "Descripcion": "Compromisos mensuales", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "MC_Cant", "Valor": "0", "Descripcion": "Cantidad", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "RP_FecAlta", "Valor": "", "Descripcion": "Fecha alta", "Tipo": "FECHA", "FechaAct": null },
          { "Nombre": "RP_Estado", "Valor": "", "Descripcion": "Estado", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CE_Importador_Es", "Valor": "No", "Descripcion": "Es importador", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "CE_Exportador_Es", "Valor": "No", "Descripcion": "Es exportador", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "PE_Proveedor_Es", "Valor": "Si", "Descripcion": "Es proveedor del estado", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "FA_Tiene", "Valor": "No", "Descripcion": "Tiene facturas apócrifas", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "DF_Tiene", "Valor": "No", "Descripcion": "Tiene Deudas Fiscales", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "PQ_12m_Cant", "Valor": "0", "Descripcion": "Pedido Quiebras Cantidad - Últ. 12 Meses", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "VI_Act04_Cod", "Valor": "", "Descripcion": "Código Actividad Secundaria (Nº 4)", "Tipo": "ENTERO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Act04_Descrip", "Valor": "", "Descripcion": "Descripción Actividad Secundaria (Nº 4)", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "CI_12m_PeorSit_Porc", "Valor": "1", "Descripcion": "Peor situación (con 10%) - Últ. 12 meses", "Tipo": "TEXTO", "FechaAct": "2026-05-31" },
          { "Nombre": "DC_Tiene", "Valor": "", "Descripcion": "Tiene documento cuestionado", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "DC_Version", "Valor": "", "Descripcion": "Descripción de versión del documento cuestionado informado.", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "DC_Motivo", "Valor": "", "Descripcion": "Motivo por el cual es se realizó la denuncia", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_TipoSocietario", "Valor": "S.R.L.", "Descripcion": "Tipo Societario de la Empresa", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "CI_Bancarizado", "Valor": "Si", "Descripcion": "Bancarizado", "Tipo": "BOOLEANO", "FechaAct": "2026-05-31" },
          { "Nombre": "VI_Act02_Sector", "Valor": "Agropecuario", "Descripcion": "Sector Actividad Secundaria (Nº2)", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Act03_Sector", "Valor": "Servicios", "Descripcion": "Sector Actividad Secundaria (Nº3)", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Act04_Sector", "Valor": "", "Descripcion": "Sector Actividad Secundaria (Nº4)", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Empleador_Act01_Descrip", "Valor": "", "Descripcion": "Descripción Actividad Principal del Empleador", "Tipo": "TEXTO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_Edad_Empresas", "Valor": "12", "Descripcion": "Edad de la Empresa", "Tipo": "ENTERO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_EdadMenor_Es", "Valor": "", "Descripcion": "Es menor de edad", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "VI_AntiguedadLaboral", "Valor": "", "Descripcion": "Antigüedad Laboral", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "VI_Inscrip_Monotributo_Es", "Valor": "", "Descripcion": "Es Monotributista", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "VI_Inscrip_Autonomo_Es", "Valor": "", "Descripcion": "Es Autónomo", "Tipo": "BOOLEANO", "FechaAct": "2026-07-02" },
          { "Nombre": "VI_EmpleadoDomestico_Es", "Valor": "", "Descripcion": "Es Empleado Doméstico", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "VI_Inscrip_IVA_Condicion", "Valor": "Activo", "Descripcion": "Condición en IVA", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_Inscrip_GCIA_Condicion", "Valor": "Activo", "Descripcion": "Condición en Ganancias", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CH_Cant", "Valor": "0", "Descripcion": "Cantidad", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "NSE_Percentil", "Valor": "", "Descripcion": "Nivel Socioeconómico - Percentil", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "RC_Vig_Cant", "Valor": "0", "Descripcion": "Cantidad - Vigente", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "RC_Vig_Fuente", "Valor": "", "Descripcion": "Fuente - Vigente", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "HM_Cant", "Valor": "0", "Descripcion": "Cantidad", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "VI_AntiguedadLaboral_EmpleadorActual", "Valor": "", "Descripcion": "Antigüedad Laboral - Empleador Actual", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "VR_Relaciones_Detalle", "Valor": "<Detalle></Detalle>", "Descripcion": "Relaciones", "Tipo": "XML", "FechaAct": null },
          { "Nombre": "VI_Actividades_Listado", "Valor": "<Detalle>...</Detalle>", "Descripcion": "Listado de las Actividades inscriptas en AFIP, Principal y Secundarias.", "Tipo": "XML", "FechaAct": null },
          { "Nombre": "VI_HistoriaLaboral_Empleadores", "Valor": "", "Descripcion": "Historia Laboral - Empleadores", "Tipo": "XML", "FechaAct": null },
          { "Nombre": "VI_Empleado_12m_Es", "Valor": "", "Descripcion": "Es Empleado - Últimos 12 Meses", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "VI_Empleador_Dom_CP", "Valor": "", "Descripcion": "Código postal", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_Empleador_Dom_Prov", "Valor": "", "Descripcion": "Provincia", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_Empleador_Act01_Sector", "Valor": "", "Descripcion": "Sector Actividad Principal del Empleador (Nº1)", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "VI_Empleador_Act01_Categoria", "Valor": "", "Descripcion": "Categoría actividad principal del empleador (Nº1)", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "COM_SO_Es", "Valor": "No", "Descripcion": "CUIL/CUIT consultado es Sujeto Obligado", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "COM_PEP_Es", "Valor": "", "Descripcion": "CUIL/CUIT consultado es  Persona expuesta políticamente", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "COM_Homonimos_LAFT_Cant", "Valor": "0", "Descripcion": "Cantidad de homónimos en base LA/FT encontrados según Razón Social o Nombre y apellido", "Tipo": "ENTERO", "FechaAct": null },
          { "Nombre": "COM_Homonimos_LAFT_Link", "Valor": "https://compliance.nosis.com/baseLAFT/Resultado?q=LYCOFULL%20SRL", "Descripcion": "Enlace de homónimos en base LA/FT encontrados según Razón Social o Nombre y apellido", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CI_12m_PeorSit_BCRA", "Valor": "1", "Descripcion": "Peor situación - Últ. 12 Meses BCRA.", "Tipo": "TEXTO", "FechaAct": null },
          { "Nombre": "CNE_CertificadoTiene", "Valor": "Si", "Descripcion": "(CNE) Cumplimiento Censal - Indica si el cuit tiene certificado.", "Tipo": "BOOLEANO", "FechaAct": null },
          { "Nombre": "CNE_CertificadoEstado_Descrip", "Valor": "Ok", "Descripcion": "(CNE) Cumplimiento Censal - Estado del certificado", "Tipo": "TEXTO", "FechaAct": null }
        ]
      }
    }
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
