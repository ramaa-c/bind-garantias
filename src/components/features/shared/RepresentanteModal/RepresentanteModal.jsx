import React, { useState, useEffect, useMemo, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle, FiEdit2, FiMail, FiPhone, FiUser, FiShield, FiMapPin, FiMap } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "../../../ui/Button/Button";
import { Modal } from "../../../ui/Modal/Modal";
import { SelectSocio } from "../../../ui/SelectSocio/SelectSocio";
import { InputSocioMasked } from "../../../ui/InputSocioMasked/InputSocioMasked";
import { BuscadorCuit } from "../../../ui/BuscadorCuit/BuscadorCuit";
import { ProcesamientoModal } from "../../../ui/ProcesamientoModal/ProcesamientoModal";
import { Spinner } from "../../../ui/Spinner/Spinner";
import { useCdaEngine } from "../../../../hooks/useCdaEngine";
import { useRegistrarModalLegajo } from "../../../../hooks/useRegistrarModalLegajo";
import { useUsuarioWebIdActual } from "../../../../hooks/useUsuario";
import { calcularEstadoDesdeHistorial, normalizarHistorialTercero } from "../../../../utils/executeCda";
import { useProvincias, useCiudades } from "../../../../hooks/useCatalogos";
import { useSincronizarCatalogoPorTexto } from "../../../../hooks/useSincronizarCatalogoPorTexto";
import { useValidarDomicilioRequerido } from "../../../../hooks/useValidarDomicilioRequerido";
import { afipService } from "../../../../services/afipService";
import { sociosService } from "../../../../services/sociosService";
import { nosisService } from "../../../../services/nosisService";
import { ConfirmacionModal } from "../ConfirmacionModal/ConfirmacionModal";
import { tercerosService } from "../../../../services/tercerosService";
import { matchProvinciaAfip } from "../../../../utils/provinciaUtils";
import { parseAddress } from "../../../../utils/direccionParser";

import styles from "./RepresentanteModal.module.css";
import { useCadenaActiva } from "../../../../hooks/useCadenaActiva";


// Motor interno compartido por RepresentanteLegalModal y ApoderadoModal —
// no se usa directo desde ningún otro lado. `rolFijo` reemplaza al viejo
// select "Rol / Tipo Relación": antes el mismo modal dejaba elegir
// Representante Legal o Apoderado sin importar el tipo de persona del
// socio (una persona física podía terminar con "Representante Legal", que
// no aplica). Ahora cada wrapper fija su propio rol y el modal no ofrece
// la opción de cambiarlo.
export function RepresentanteModal({
  isOpen,
  onClose,
  onSuccess,              // Legajo mode: callback after database save
  representante,          // Legajo mode: DB representation of the representative
  socioIdActivo,          // Both: active partner ID to link the relation
  representanteInicial,   // Form mode: initial representative data for edit
  onGuardar,              // Form mode: callback to update parent React Hook Form state
  rolFijo,                // "Representante Legal" | "Apoderado" - lo fija el wrapper, no el usuario.
}) {
  const { cadenaSlug } = useCadenaActiva();
  const cadenaValorIdParam = Number(cadenaSlug) || 0;
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");
  const etiquetaRol = rolFijo;
  const [validando, setValidando] = useState(false);
  const [enriqueciendoAuto] = useState(false);
  const [afipValidado, setAfipValidado] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [procesoModal, setProcesoModal] = useState({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });

  const { ejecutarValidaciones } = useCdaEngine();
  const usuarioWebIdActual = useUsuarioWebIdActual();
  const queryClient = useQueryClient();
  // Cuando el CDA rechaza en el guardado de una edición, en vez de un
  // timeout fijo se espera a que el usuario apriete "Continuar" en el
  // ProcesamientoModal antes de seguir con el guardado real — así tiene
  // tiempo de leer el motivo del rechazo (reportado el 2026-08-21). Solo se
  // usa acá; en null no hace nada.
  const cdaContinuarResolveRef = useRef(null);
  // Guarda el TerceroID del stub creado para poder validar el CDA contra él
  // más abajo — `stubTerceroId` (ver más abajo) vive dentro de un try{} que
  // sale de scope antes de llegar a ejecutarValidaciones.
  const stubTerceroIdRef = useRef(null);
  useRegistrarModalLegajo(isOpen);

  const { control, reset, setValue, setError, clearErrors, trigger, getValues, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      cuit: "",
      nombre: "",
      rol: rolFijo,
      email: "",
      telefono: "",
      direccion: "",
      calle: "",
      numero: 0,
      piso: "",
      departamento: "",
      ciudad: "",
      ciudadid: 0,
      provinciaid: "",
      codpos: "",
    }
  });

  // Reset de valores Y errores en el mismo pase de render que se detecta el
  // cambio de props (en vez de en un useEffect aparte, que corre un render
  // despues) - evita que se vea un frame con los datos/errores de la
  // sesion anterior (ej. "El telefono es obligatorio") apenas se reabre el
  // modal para cargar un tercero distinto.
  const [prevProps, setPrevProps] = useState({ isOpen, representante, representanteInicial });
  if (isOpen !== prevProps.isOpen || representante !== prevProps.representante || representanteInicial !== prevProps.representanteInicial) {
    setPrevProps({ isOpen, representante, representanteInicial });
    if (isOpen) {
      setAfipValidado(!!(representante || representanteInicial));
      setShowConfirm(false);

      if (representante) {
        // Legajo mode edit — ver useObtenerDatosSocioLegajo (useTerceros.js):
        // arma el domicilio de representantes con el mismo mapeo que usa
        // para accionistas (mismo tercero compartido), aunque este modal
        // antes no lo mostrara.
        const parsedDir = parseAddress(representante.direccion || representante.calle || "");
        reset({
          cuit: representante.cuit || "",
          nombre: representante.nombre || "",
          rol: rolFijo,
          email: representante.email || "",
          telefono: representante.telefono || "",
          direccion: representante.direccion || "",
          calle: representante.calle || parsedDir.calle || "",
          numero: Number(representante.numero) || parsedDir.numero || 0,
          piso: representante.piso || parsedDir.piso || "",
          departamento: representante.departamento || parsedDir.departamento || "",
          ciudad: representante.ciudad || "",
          ciudadid: Number(representante.ciudadid) || 0,
          provinciaid: String(representante.provinciaid || ""),
          codpos: representante.codpos || "",
        });
      } else if (representanteInicial) {
        // Form mode edit
        const parsedDir = parseAddress(representanteInicial.direccion || representanteInicial.calle || "");
        reset({
          cuit: representanteInicial.cuit || "",
          nombre: representanteInicial.nombre || "",
          rol: rolFijo,
          email: representanteInicial.email || "",
          telefono: representanteInicial.celular || representanteInicial.telefono || "",
          direccion: representanteInicial.direccion || "",
          calle: representanteInicial.calle || parsedDir.calle || "",
          numero: Number(representanteInicial.numero) || parsedDir.numero || 0,
          piso: representanteInicial.piso || parsedDir.piso || "",
          departamento: representanteInicial.departamento || parsedDir.departamento || "",
          ciudad: representanteInicial.ciudad || "",
          ciudadid: Number(representanteInicial.ciudadid) || 0,
          provinciaid: String(representanteInicial.provinciaid || ""),
          codpos: representanteInicial.codpos || "",
        });
      } else {
        // Create mode (both)
        reset({
          cuit: "",
          nombre: "",
          rol: rolFijo,
          email: "",
          telefono: "",
          direccion: "",
          calle: "",
          numero: 0,
          piso: "",
          departamento: "",
          ciudad: "",
          ciudadid: 0,
          provinciaid: "",
          codpos: "",
        });
      }
    }
  }

  const cuitValue = useWatch({ control, name: "cuit" });
  const nombreValue = useWatch({ control, name: "nombre" });
  const currentProvincia = useWatch({ control, name: "provinciaid" });

  const { data: provinciasData, isLoading: cargandoProvincias } = useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];
  const { data: ciudadesData, isLoading: cargandoCiudades } = useCiudades(currentProvincia);
  const opcionesCiudades = useMemo(() => ciudadesData?.opciones || [], [ciudadesData]);

  const currentCiudad = useWatch({ control, name: "ciudad" });
  const currentCiudadId = useWatch({ control, name: "ciudadid" });
  const currentCalle = useWatch({ control, name: "calle" });

  // Ciudad se filtra por la provincia elegida (useCiudades recibe
  // currentProvincia) - ver useSincronizarCatalogoPorTexto para el detalle
  // de como se resuelve/limpia ciudadid (AFIP/Nosis/LUFE solo traen el
  // nombre de la ciudad en texto, nunca un id ya resuelto).
  useSincronizarCatalogoPorTexto({
    cargando: cargandoCiudades,
    opciones: opcionesCiudades,
    valorTexto: currentCiudad,
    valorId: currentCiudadId,
    campoTexto: "ciudad",
    campoId: "ciudadid",
    setValue,
  });

  const validarDomicilio = useValidarDomicilioRequerido({
    getValues,
    setError,
    clearErrors,
    errors,
    currentCalle,
    currentProvincia,
    currentCiudadId,
  });

  useEffect(() => {
    if (errors.cuit?.type === "manual") {
      clearErrors("cuit");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuitValue, clearErrors]);

  const handleAfipLookup = async () => {
    const cuitLimpio = String(cuitValue || "").replace(/\D/g, "");
    
    if (!cuitLimpio || cuitLimpio.length !== 11) {
      setError("cuit", { type: "manual", message: "Por favor, ingrese un CUIT de 11 dígitos válido." });
      return;
    }
    
    setValidando(true);
    clearErrors("cuit");

    // Refleja los 3 tramos reales de esta función, en el mismo orden que
    // Paso1Cuit: vincular (solo alta nueva) → consultar padrón → CDA al
    // final. A diferencia de Paso1Cuit, acá el CDA YA NO bloquea si
    // rechaza: se deja completar y guardar igual, y la persona queda
    // marcada como rechazada (ver AccionistasSection/RepresentantesSection/
    // ApoderadosSection) para que un admin la reintente después. Solo el
    // padrón (no encontrar a la persona en ningún lado) sigue bloqueando —
    // ahí no hay nada razonable para completar a mano. En edición no hay
    // nada que vincular, así que ese paso arranca directo "completado".
    const necesitaVinculo = socioIdActivo && !representante && !representanteInicial;

    setProcesoModal({
      isOpen: true,
      titulo: `Validando ${etiquetaRol}`,
      pasos: [
        { id: "vinculo", etiqueta: "Vinculando con el socio", estado: necesitaVinculo ? "cargando" : "completado", descripcion: "Registrando la relación en el sistema." },
        { id: "padron", etiqueta: "Consultando datos de la persona", estado: necesitaVinculo ? "pendiente" : "cargando", descripcion: "Obteniendo los datos de la persona en tiempo real." },
        { id: "cda", etiqueta: "Verificando requisitos", estado: "pendiente", descripcion: "Comprobando políticas de riesgo y negocio para el alta." },
      ],
      hasError: false,
      isSystemError: false
    });

    // El motor de CDAs para PANTALLA_SOCIOS necesita que la relación
    // tercero<->socio ya exista para resolver el contexto — si no, el
    // backend responde 500 (EAccessViolation, confirmado en vivo). Se crea
    // un stub (participación no aplica acá, pero sí porcacciones=0) ANTES
    // de validar, igual que en SocioAccionistaModal. Solo aplica al alta
    // nueva en modo legajo: si es edición (representante/representanteInicial)
    // la relación ya existe; si no hay socioIdActivo (modo formulario del
    // wizard de Alta de Operación) tampoco corresponde crear nada en la
    // base todavía. `onConfirmSave` ya busca la relación existente por
    // terceroId+socio antes de decidir crear o actualizar, así que no hace
    // falta guardar el ID acá: la va a encontrar sola.
    if (necesitaVinculo) {
      try {
        // Denominacion y descripcionreducida van VACÍAS a propósito para el
        // caso de que haya que crearlo: la precarga de más abajo hace
        // `terceroEncontrado?.denominacion || nosisData...`, y un
        // placeholder no vacío gana esa cadena de ORs, pisando el nombre
        // real que devuelva NOSIS/AFIP. `buscarOCrearTercero` busca primero
        // por CUIT y reutiliza el existente si lo hay (evitando duplicarlo).
        const terceroResuelto = await tercerosService.buscarOCrearTercero(cuitLimpio, {
          tercerorelacionadoid: 0,
          denominacion: "",
          cuit: cuitLimpio,
          bcraid: 0,
          tipopersonaid: 1,
          tipodocumentoid: 0,
          numerodocumento: cuitLimpio,
          estadocivilid: 0,
          ciudadid: 0,
          telefono: "",
          conyuge: "",
          actividad: "",
          contacto: "",
          nrocuenta: "",
          codigomercado: "",
          calle: "",
          numero: 0,
          piso: "",
          departamento: "",
          codpos: "",
          descripcionreducida: "",
          mail: "",
        });
        const stubTerceroId =
          terceroResuelto.tercerorelacionadoid ||
          terceroResuelto.TerceroRelacionadoID ||
          terceroResuelto.id;
        stubTerceroIdRef.current = stubTerceroId;

        const relaciones = await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
        const arrRel = Array.isArray(relaciones) ? relaciones : relaciones?.data || [];
        const relacionExistente = arrRel.find(
          (r) =>
            Number(r.terceroid ?? r.tercerorelacionadoid ?? r.TerceroRelacionadoID) === Number(stubTerceroId) &&
            [210, 230].includes(Number(r.tiporelacionsocioid ?? r.TipoRelacionSocioID ?? r.tiporelacionsocioId)),
        );

        if (!relacionExistente) {
          const ahoraStub = new Date().toISOString().split(".")[0];
          const unAnioMasStub = new Date();
          unAnioMasStub.setFullYear(unAnioMasStub.getFullYear() + 1);
          const targetRolIdStub = rolFijo === "Apoderado" ? 210 : 230;
          await tercerosService.guardarRelacionesDeSocio({
            socioid: socioIdActivo,
            tercerosrelacionados: [
              {
                sociotercerorelacionid: 0,
                socioid: socioIdActivo,
                terceroid: stubTerceroId,
                tiporelacionsocioid: targetRolIdStub,
                fechadesde: ahoraStub,
                fechahasta: unAnioMasStub.toISOString().split(".")[0],
                porcacciones: 0,
                nroinscripcion: "",
                condicionescomerciales: "",
                cbu: "",
                nrosubcuentacaja: "",
                sucursalid: 0,
                default: "0",
                subtiporelacionsocioid: 0,
                telefono: "",
                momento: ahoraStub,
              },
            ],
          });
        }
        // La relación ya quedó creada en la base en este punto (aunque
        // todavía falte completar el formulario y guardar) — se avisa ya
        // para que la lista de representantes/apoderados se refresque y lo
        // muestre, en vez de esperar a que se cierre/guarde la modal.
        if (onSuccess) onSuccess();
      } catch (stubErr) {
        // No bloqueamos la validación por esto: si falla, seguimos igual
        // (en el peor caso, el CDA va a fallar con el mismo error que ya
        // conocíamos antes de este cambio).
        console.error("[RepresentanteModal] Error creando la relación previa a validar CDA:", stubErr);
      }
      setProcesoModal(prev => ({
        ...prev,
        pasos: prev.pasos.map(p =>
          p.id === "vinculo" ? { ...p, estado: "completado" } :
          p.id === "padron" ? { ...p, estado: "cargando" } : p
        ),
      }));
    }

    try {
      // 1. Buscar primero en la base de datos de terceros
      let terceroEncontrado = null;
      try {
        const existentes = await tercerosService.obtenerTerceros({ Cuit: cuitLimpio });
        const arr = Array.isArray(existentes) ? existentes : existentes?.data || [];
        if (arr.length > 0) {
          terceroEncontrado = arr[0];
        }
      } catch (dbErr) {
        console.warn("[RepresentanteModal] Error buscando tercero en base de datos local:", dbErr);
      }

      // Si existe en la BD y tiene los datos mínimos, los usamos directamente si no estamos editando
      const tieneDatosCompletos = terceroEncontrado &&
        (terceroEncontrado.mail || terceroEncontrado.email || terceroEncontrado.Mail);

      // El CDA corre AL FINAL (ver más abajo), después de que el padrón
      // haya terminado por cualquiera de los dos caminos posibles —
      // `padronOk` es lo que permite que el segundo (NOSIS/AFIP/LUFE) se
      // salte cuando el primero (datos locales) ya alcanzó.
      let padronOk = false;

      if (terceroEncontrado && tieneDatosCompletos && !representante && !representanteInicial) {
        const nombreRep = terceroEncontrado.denominacion || terceroEncontrado.razonsocial || terceroEncontrado.nombre || "Representante del Sistema";
        setValue("nombre", nombreRep, { shouldValidate: true, shouldDirty: true });
        setValue("email", terceroEncontrado.mail || terceroEncontrado.email || terceroEncontrado.Mail || "", { shouldValidate: true, shouldDirty: true });
        setValue("telefono", terceroEncontrado.telefono || terceroEncontrado.Telefono || "", { shouldValidate: true, shouldDirty: true });

        const direccionExistente = terceroEncontrado.calle || terceroEncontrado.Calle || terceroEncontrado.direccion || "";
        setValue("direccion", direccionExistente, { shouldValidate: true, shouldDirty: true });
        const parsedDirExistente = parseAddress(direccionExistente);
        setValue("calle", parsedDirExistente.calle || terceroEncontrado.calle || "", { shouldValidate: true, shouldDirty: true });
        setValue("numero", Number(terceroEncontrado.numero) || parsedDirExistente.numero || 0, { shouldValidate: true, shouldDirty: true });
        setValue("piso", terceroEncontrado.piso || parsedDirExistente.piso || "", { shouldValidate: true, shouldDirty: true });
        setValue("departamento", terceroEncontrado.departamento || parsedDirExistente.departamento || "", { shouldValidate: true, shouldDirty: true });
        setValue("ciudad", terceroEncontrado.ciudad || "", { shouldValidate: true, shouldDirty: true });
        setValue("ciudadid", Number(terceroEncontrado.ciudadid) || 0, { shouldValidate: true, shouldDirty: true });
        setValue("codpos", terceroEncontrado.codpos || "", { shouldValidate: true, shouldDirty: true });
        const provIdExistente = terceroEncontrado.provinciaid || terceroEncontrado.ProvinciaID || 0;
        if (provIdExistente) {
          setValue("provinciaid", String(provIdExistente), { shouldValidate: true, shouldDirty: true });
        }

        toast.success(`Datos del ${etiquetaRol.toLowerCase()} recuperados del sistema.`);
        padronOk = true;
      }

      // 2. Si no tiene datos completos o es modo edición, consultamos NOSIS/AFIP/LUFE
      // (solo si el camino anterior no alcanzó ya)
      let nosisData = null;
      let res = null;
      if (!padronOk)
      try {
        nosisData = await nosisService.obtenerDatosNormalizados(cuitLimpio);
      } catch (nosisErr) {
        console.warn("[RepresentanteModal] Nosis no disponible, probando fallback a AFIP:", nosisErr);
      }

      if (!padronOk && !nosisData) {
        try {
          res = await afipService.obtenerConstanciaInscripcion(cuitLimpio);
        } catch (afipErr) {
          console.warn("[RepresentanteModal] AFIP no disponible, probando fallback a LUFE Entidad:", afipErr);
          try {
            const lufeEntidad = await sociosService.obtenerEntidadLufe(cuitLimpio);
            if (lufeEntidad && lufeEntidad.success) {
              res = sociosService.normalizarLufeAEstructuraAfip(lufeEntidad);
            }
          } catch (lufeErr) {
            console.error("[RepresentanteModal] LUFE Entidad también falló:", lufeErr);
          }
        }
      }

      if (!padronOk && (nosisData || (res && res.datosgenerales))) {
        let nombreRep = "";
        let emailVal = "";
        let telVal = "";
        let direccionVal = "";
        let parsedDir = { calle: "", numero: 0, piso: "" };
        let deptoVal = "";
        let ciudadVal = "";
        let codposVal = "";
        let provIdVal = 0;

        if (nosisData) {
          nombreRep = terceroEncontrado?.denominacion || terceroEncontrado?.razonsocial || terceroEncontrado?.nombre ||
                      nosisData.VI_RazonSocial || `${nosisData.VI_Nombre || ""} ${nosisData.VI_Apellido || ""}`.trim() || "Representante";
          emailVal = (terceroEncontrado?.mail || terceroEncontrado?.email || terceroEncontrado?.Mail) || "";
          telVal = (terceroEncontrado?.telefono || terceroEncontrado?.Telefono) || "";
          direccionVal = (terceroEncontrado?.calle || terceroEncontrado?.Calle || terceroEncontrado?.direccion) ||
                         `${nosisData.VI_DomAF_Calle || ""} ${nosisData.VI_DomAF_Nro || ""}`.trim() || "";
          parsedDir = parseAddress(direccionVal);
          deptoVal = terceroEncontrado?.departamento || nosisData.VI_DomAF_Dto || "";
          ciudadVal = nosisData.VI_DomAF_Loc || "";
          codposVal = terceroEncontrado?.codpos || nosisData.VI_DomAF_CP || "";
          provIdVal = terceroEncontrado?.provinciaid || terceroEncontrado?.ProvinciaID || 0;
          if (!provIdVal && nosisData.VI_DomAF_Prov) {
            const match = matchProvinciaAfip(nosisData.VI_DomAF_Prov, opcionesProvincias);
            if (match) provIdVal = match.value;
          }
        } else {
          const dg = res.datosgenerales;
          nombreRep = terceroEncontrado?.denominacion || terceroEncontrado?.razonsocial || terceroEncontrado?.nombre ||
                      dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim() || "Representante AFIP";
          emailVal = (terceroEncontrado?.mail || terceroEncontrado?.email || terceroEncontrado?.Mail) || dg.email || dg.emailfacturacion || "";
          telVal = (terceroEncontrado?.telefono || terceroEncontrado?.Telefono) || dg.telefono || "";
          const dom = dg.domiciliofiscal || dg.domicilio;
          direccionVal = (terceroEncontrado?.calle || terceroEncontrado?.Calle || terceroEncontrado?.direccion) ||
                         (dom ? (dom.direccion || (dom.calle ? `${dom.calle} ${dom.numero || ""}`.trim() : "")) : "") || "";
          parsedDir = parseAddress(direccionVal);
          deptoVal = dom?.departamento || terceroEncontrado?.departamento || "";
          ciudadVal = dom?.localidad || "";
          codposVal = dom?.codpostal || terceroEncontrado?.codpos || "";
          provIdVal = terceroEncontrado?.provinciaid || terceroEncontrado?.ProvinciaID || 0;
          if (!provIdVal && dom) {
            const provNombre = dom.descripcionprovincia || dom.provincia || "";
            if (provNombre) {
              const match = matchProvinciaAfip(provNombre, opcionesProvincias);
              if (match) provIdVal = match.value;
            }
          }
        }

        setValue("nombre", nombreRep, { shouldValidate: true, shouldDirty: true });
        setValue("email", emailVal, { shouldValidate: true, shouldDirty: true });
        setValue("telefono", telVal, { shouldValidate: true, shouldDirty: true });
        setValue("direccion", direccionVal, { shouldValidate: true, shouldDirty: true });
        setValue("calle", parsedDir.calle, { shouldValidate: true, shouldDirty: true });
        setValue("numero", parsedDir.numero ?? "", { shouldValidate: true, shouldDirty: true });
        setValue("piso", parsedDir.piso, { shouldValidate: true, shouldDirty: true });
        setValue("departamento", deptoVal, { shouldValidate: true, shouldDirty: true });
        setValue("ciudad", ciudadVal, { shouldValidate: true, shouldDirty: true });
        setValue("ciudadid", Number(terceroEncontrado?.ciudadid) || 0, { shouldValidate: true, shouldDirty: true });
        setValue("codpos", codposVal, { shouldValidate: true, shouldDirty: true });
        if (provIdVal) {
          setValue("provinciaid", String(provIdVal), { shouldValidate: true, shouldDirty: true });
        }

        // Se persiste YA lo que trajo AFIP/NOSIS: si el usuario cierra sin
        // guardar y vuelve más tarde, no se pierde (antes quedaba solo en
        // el formulario en memoria, y el tercero en la base seguía con
        // denominacion="" del stub). `terceroEncontrado` acá ya es el stub
        // recién creado (se buscó por el mismo CUIT más arriba). Lo que
        // falta (rol definitivo, o ediciones manuales) se guarda en
        // onConfirmSave.
        const idParaPersistir = terceroEncontrado?.tercerorelacionadoid || terceroEncontrado?.TerceroRelacionadoID || terceroEncontrado?.id;
        if (idParaPersistir && !representante && !representanteInicial) {
          try {
            // Mismo cuidado que en onConfirmSave: preservar lo que el
            // tercero ya tenía en los campos que este modal no gestiona
            // (conyuge, actividad, etc.) — domicilio ahora sí lo gestiona,
            // así que se manda el recién resuelto (parsedDir/provIdVal),
            // no el preservado.
            await tercerosService.actualizarTercero({
              tercerorelacionadoid: idParaPersistir,
              denominacion: nombreRep,
              cuit: cuitLimpio,
              bcraid: terceroEncontrado?.bcraid ?? 0,
              tipopersonaid: 1,
              tipodocumentoid: terceroEncontrado?.tipodocumentoid ?? 0,
              numerodocumento: cuitLimpio,
              estadocivilid: terceroEncontrado?.estadocivilid ?? 0,
              ciudadid: Number(terceroEncontrado?.ciudadid) || 0,
              provinciaid: Number(provIdVal) || 0,
              telefono: telVal,
              conyuge: terceroEncontrado?.conyuge ?? "",
              actividad: terceroEncontrado?.actividad ?? "",
              contacto: terceroEncontrado?.contacto ?? "",
              nrocuenta: terceroEncontrado?.nrocuenta ?? "",
              codigomercado: terceroEncontrado?.codigomercado ?? "",
              calle: parsedDir.calle || direccionVal || "",
              numero: Number(parsedDir.numero) || 0,
              piso: parsedDir.piso || "",
              departamento: deptoVal || "",
              codpos: codposVal || "",
              descripcionreducida: nombreRep.substring(0, 20),
              mail: emailVal,
            });
            // La tarjeta ya se mostraba "sin nombre" desde que se creó el
            // stub — se refresca de nuevo para que pase a mostrar el
            // nombre real sin esperar al guardado final.
            if (onSuccess) onSuccess();
          } catch (persistErr) {
            console.warn("[RepresentanteModal] No se pudo persistir la precarga de AFIP/NOSIS:", persistErr);
          }
        }

        toast.success(representante || representanteInicial ? "Datos actualizados correctamente." : `Datos del ${etiquetaRol.toLowerCase()} recuperados.`);
        padronOk = true;
      } else if (!padronOk) {
        // Padrón no encontrado por ningún lado: acá sí se bloquea, no hay
        // nada razonable para completar a mano sin al menos un nombre.
        setError("cuit", { type: "manual", message: "CUIT no encontrado. Revisá que sea correcto." });
        setAfipValidado(false);
        setProcesoModal(prev => ({
          ...prev,
          hasError: true,
          isSystemError: false,
          pasos: prev.pasos.map(p =>
            p.id === "padron" ? { ...p, estado: "error", errores: ["No pudimos verificar los datos de este CUIT. Revisá que sea correcto e intentá nuevamente."] } : p
          ),
        }));
        setValidando(false);
        return;
      }
    } catch (err) {
      console.error("Error validando representante en AFIP/SGR:", err);
      setError("cuit", { type: "manual", message: "El servicio de verificación no está disponible en este momento. Intentá nuevamente más tarde." });
      setAfipValidado(false);
      setProcesoModal(prev => ({
        ...prev,
        hasError: true,
        isSystemError: true,
        pasos: prev.pasos.map(p =>
          p.id === "padron" ? { ...p, estado: "error", errores: ["El servicio de verificación no está disponible en este momento. Intentá nuevamente en unos minutos."] } : p
        ),
      }));
      setValidando(false);
      return;
    }

    // Padrón resuelto (por cualquiera de los dos caminos): ahora sí corre
    // el CDA, al final. Ya NO bloquea si rechaza — se deja completar y
    // guardar el formulario igual; la persona queda con la ejecución
    // rechazada en su historial (ver AccionistasSection/RepresentantesSection/
    // ApoderadosSection, que la muestran en rojo) para que un admin la
    // reintente después desde EmpresaDetalle.
    setProcesoModal(prev => ({
      ...prev,
      pasos: prev.pasos.map(p =>
        p.id === "padron" ? { ...p, estado: "completado" } :
        p.id === "cda" ? { ...p, estado: "cargando" } : p
      ),
    }));

    const terceroIdValidacion =
      representante?.id ||
      (representanteInicial?.preloadedFromDb ? representanteInicial?.id : null) ||
      stubTerceroIdRef.current;

    if (!terceroIdValidacion) {
      setProcesoModal(prev => ({
        ...prev,
        hasError: true,
        isSystemError: true,
        pasos: prev.pasos.map(p =>
          p.id === "cda" ? {
              ...p,
              estado: "error",
              errores: ["No se pudo identificar a la persona para validar los criterios de aceptación. Intentá nuevamente."]
          } : p
        )
      }));
      setAfipValidado(false);
      setValidando(false);
      return;
    }

    const result = await ejecutarValidaciones("PANTALLA_SOCIOS", { terceroId: terceroIdValidacion }, cadenaValorIdParam, usuarioWebIdActual);

    // Sin esto, la card de la lista (RepresentantesSection/ApoderadosSection,
    // vía useEstadoCdaTerceros) y el badge de TerceroCdaEstado siguen
    // mostrando el estado viejo hasta que algo más los refresque (ej.
    // "Volver a ejecutar", o que venza el staleTime) — el CDA sí quedó bien
    // registrado en el backend, pero la UI no se enteraba solo con esto.
    queryClient.invalidateQueries({ queryKey: ["terceros", "executeCda", terceroIdValidacion] });
    queryClient.invalidateQueries({ queryKey: ["terceros", "estadoCdaBulk"] });

    if (!result.success) {
      // hasError:true acá muestra el botón "Continuar" del ProcesamientoModal
      // y NO se auto-cierra (a diferencia del caso exitoso, más abajo): sin
      // esto, el aviso de que el CDA no se cumplió pasaba de largo en
      // 1200ms y el usuario se quedaba sin poder leerlo (reportado el
      // 2026-08-21). El resto del formulario ya quedó habilitado igual
      // (setAfipValidado(true) corre siempre) — cerrar este modal no
      // bloquea nada, solo le da tiempo al usuario a leer antes de seguir.
      setProcesoModal(prev => ({
        ...prev,
        hasError: true,
        pasos: prev.pasos.map(p =>
          p.id === "cda" ? { ...p, estado: "alerta", errores: result.errors.map(e => e.message) } : p
        ),
      }));
    } else {
      setProcesoModal(prev => ({
        ...prev,
        pasos: prev.pasos.map(p => (p.id === "cda" ? { ...p, estado: "completado" } : p)),
      }));
      setTimeout(() => {
        setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
      }, 600);
    }

    setAfipValidado(true);
    setValidando(false);
  };

  const handlePreSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const calleVal = getValues("calle") || "";
    const numeroVal = getValues("numero") || "";
    const pisoVal = getValues("piso") || "";
    const deptoVal = getValues("departamento") || "";

    let fullDir = calleVal;
    if (numeroVal && Number(numeroVal) > 0) fullDir += ` ${numeroVal}`;
    if (pisoVal) fullDir += ` Piso:${pisoVal}`;
    if (deptoVal) fullDir += ` Dpto:${deptoVal}`;

    setValue("direccion", fullDir, { shouldDirty: true });

    const ciudadidVal = getValues("ciudadid");
    if (ciudadidVal) {
      const selectedCiudad = opcionesCiudades.find((c) => String(c.value) === String(ciudadidVal));
      if (selectedCiudad) {
        setValue("ciudad", selectedCiudad.label, { shouldDirty: true });
      }
    }

    const isValid = await trigger();
    const domicilioValido = validarDomicilio();
    if (!isValid || !domicilioValido) return;

    if (!isDirty) {
      onClose();
      return;
    }

    // Both direct DB save modes will show the confirmation modal
    setShowConfirm(true);
  };

  const onConfirmSave = async () => {
    // Al editar un representante/apoderado existente (ej. precargado por
    // LUFE) el paso de "Validar CUIT" se salta directo al formulario —
    // handleAfipLookup, que es donde corre el CDA, nunca se dispara. Acá,
    // recién al confirmar el guardado (no antes, en el primer click de
    // "Guardar Cambios"), es la única oportunidad de validarlo, ya con los
    // datos completos.
    //
    // Se cierra el diálogo de confirmación genérico y se muestra el mismo
    // modal de progreso que usa handleAfipLookup, para que quede visible
    // que se está validando — antes esto corría en silencio (solo el
    // spinner del botón) y era fácil no darse cuenta.
    //
    // Si ya tiene un CDA Aprobado vigente (mismo cálculo que usa
    // TerceroCdaEstado para el badge), se confía en eso y no se vuelve a
    // ejecutar. Si rechaza, YA NO bloquea el guardado (unificado con
    // handleAfipLookup): se guarda igual, y la persona queda marcada en
    // rojo en la lista para que un admin la reintente después.
    if (representante || representanteInicial) {
      const terceroIdValidacion =
        representante?.id ||
        (representanteInicial?.preloadedFromDb ? representanteInicial?.id : null);

      if (terceroIdValidacion) {
        let yaAprobado = false;
        try {
          const historial = await tercerosService.obtenerExecuteCda(terceroIdValidacion);
          yaAprobado = calcularEstadoDesdeHistorial(normalizarHistorialTercero(historial)) === "aprobado";
        } catch (histErr) {
          console.warn("[RepresentanteModal] No se pudo obtener el historial de CDA, se re-ejecuta por las dudas:", histErr);
        }

        if (!yaAprobado) {
          setShowConfirm(false);
          setProcesoModal({
            isOpen: true,
            titulo: `Validando ${etiquetaRol}`,
            pasos: [
              { id: "cda", etiqueta: "Verificando requisitos", estado: "cargando", descripcion: "Comprobando políticas de riesgo y negocio." },
            ],
            hasError: false,
            isSystemError: false,
          });
          const resultCda = await ejecutarValidaciones("PANTALLA_SOCIOS", { terceroId: terceroIdValidacion }, cadenaValorIdParam, usuarioWebIdActual);
          // Ver comentario equivalente en handleAfipLookup: sin esto la
          // card de la lista y el badge de TerceroCdaEstado quedan
          // mostrando el estado viejo hasta que algo más los refresque.
          queryClient.invalidateQueries({ queryKey: ["terceros", "executeCda", terceroIdValidacion] });
          queryClient.invalidateQueries({ queryKey: ["terceros", "estadoCdaBulk"] });
          if (resultCda.success) {
            setProcesoModal((prev) => ({
              ...prev,
              pasos: prev.pasos.map((p) => (p.id === "cda" ? { ...p, estado: "completado" } : p)),
            }));
            await new Promise((resolve) => setTimeout(resolve, 500));
            setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
          } else {
            // hasError:true muestra el botón "Continuar" y no hay timeout:
            // se espera a que el usuario lo apriete (ver onClose del
            // ProcesamientoModal más abajo, que resuelve esta promesa)
            // antes de seguir con el guardado real de más abajo.
            setProcesoModal((prev) => ({
              ...prev,
              hasError: true,
              pasos: prev.pasos.map((p) =>
                p.id === "cda" ? { ...p, estado: "alerta", errores: resultCda.errors.map((e) => e.message) } : p
              ),
            }));
            await new Promise((resolve) => {
              cdaContinuarResolveRef.current = resolve;
            });
          }
        }
      }
    }

    const formData = getValues();
    try {
      const cuitLimpio = String(formData.cuit).replace(/\D/g, "");

      // Si ya se sabe qué tercero se está editando, se usa ese ID directo
      // en vez de volver a buscar por CUIT: si hay más de un tercero con el
      // mismo CUIT (ej. un stub viejo que quedó sin vincular), la búsqueda
      // por CUIT puede devolver uno DISTINTO al que la relación de este
      // socio ya apunta — el PUT de abajo actualizaría ese otro registro, y
      // la relación seguiría mostrando el de siempre: el guardado avisa
      // éxito, pero los cambios nunca se ven al reabrir.
      const idConocido =
        representante?.id ||
        (representanteInicial?.preloadedFromDb ? representanteInicial?.id : null);

      let terceroId = idConocido || null;
      let terceroExistente = null;

      if (terceroId) {
        try {
          terceroExistente = await tercerosService.obtenerTerceroPorId(terceroId);
        } catch (err) {
          console.warn(
            "[RepresentanteModal] Error obteniendo tercero por ID conocido:",
            err,
          );
        }
      } else {
        try {
          const existentes = await tercerosService.obtenerTerceros({
            Cuit: cuitLimpio,
          });
          const arr = Array.isArray(existentes)
            ? existentes
            : existentes?.data || [];
          if (arr.length > 0) {
            terceroExistente = arr[0];
            terceroId =
              terceroExistente.tercerorelacionadoid ||
              terceroExistente.TerceroRelacionadoID ||
              terceroExistente.id;
          }
        } catch (err) {
          console.warn(
            "[RepresentanteModal] Error buscando tercero existente:",
            err,
          );
        }
      }

      // ⚠️ Este modal gestiona cuit/nombre/rol/email/teléfono/domicilio —
      // no participación ni DNI (eso sigue siendo exclusivo de
      // SocioAccionistaModal). TerceroRelacionado es un registro
      // COMPARTIDO: la misma persona puede ser también accionista, y el
      // PUT de abajo (api/TerceroRelacionado) reemplaza el registro
      // entero. El domicilio ahora se manda con lo que hay en el
      // formulario (formData.calle/numero/etc. — se precargan solos desde
      // el tercero existente o Nosis/AFIP en handleAfipLookup, igual que
      // en SocioAccionistaModal). Lo que este modal NO gestiona
      // (conyuge, actividad, estadocivilid, etc.) se sigue preservando del
      // tercero existente para no perderlo — eso fue justamente lo que
      // rompía el requisito de accionistas antes de este cambio.
      const payloadTercero = {
        tercerorelacionadoid: terceroId || 0,
        denominacion: formData.nombre,
        cuit: cuitLimpio,
        bcraid: terceroExistente?.bcraid ?? 0,
        tipopersonaid: 1,
        tipodocumentoid: terceroExistente?.tipodocumentoid ?? 0,
        numerodocumento: cuitLimpio,
        estadocivilid: terceroExistente?.estadocivilid ?? 0,
        ciudadid: Number(formData.ciudadid) || 0,
        provinciaid: Number(formData.provinciaid) || 0,
        telefono: formData.telefono || "",
        conyuge: terceroExistente?.conyuge ?? "",
        actividad: terceroExistente?.actividad ?? "",
        contacto: terceroExistente?.contacto ?? "",
        nrocuenta: terceroExistente?.nrocuenta ?? "",
        codigomercado: terceroExistente?.codigomercado ?? "",
        calle: formData.calle || formData.direccion || "",
        numero: Number(formData.numero) || 0,
        piso: formData.piso || "",
        departamento: formData.departamento || "",
        codpos: formData.codpos || "",
        descripcionreducida: formData.nombre.substring(0, 20),
        mail: formData.email || "",
      };

      if (terceroId) {
        await tercerosService.actualizarTercero(payloadTercero);
      } else {
        const res = await tercerosService.crearTercero(payloadTercero);
        terceroId = res.tercerorelacionadoid || res.id;
      }

      const ahora = new Date().toISOString().split(".")[0];
      const unAnioMas = new Date();
      unAnioMas.setFullYear(unAnioMas.getFullYear() + 1);
      const unAnioMasStr = unAnioMas.toISOString().split(".")[0];
      const targetRolId = rolFijo === "Apoderado" ? 210 : 230;
      let relacionGuardada = null;

      // Direct Save to DB if socioIdActivo is present
      if (socioIdActivo) {
        // Check if a relationship already exists in DB for this partner and representative to avoid duplicates
        let relacionExistente = null;
        try {
          const relaciones = await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
          const arrRel = Array.isArray(relaciones) ? relaciones : relaciones?.data || [];
          relacionExistente = arrRel.find(
            (r) =>
              Number(r.terceroid || r.tercerorelacionadoid || r.TerceroRelacionadoID) === Number(terceroId) &&
              [210, 230].includes(Number(r.tiporelacionsocioid || r.TipoRelacionSocioID || r.tiporelacionsocioId))
          );
        } catch (relErr) {
          console.warn("[RepresentanteModal] Error consultando relaciones del socio:", relErr);
        }

        const activeRel = representante || (representanteInicial?.preloadedFromDb ? representanteInicial : null) || relacionExistente;

        if (activeRel?.relacionId || activeRel?.relacion?.sociotercerorelacionid || activeRel?.sociotercerorelacionid) {
          const payloadRel = {
            ...(activeRel?.relacion || activeRel),
            tiporelacionsocioid: targetRolId,
            telefono: formData.telefono || "",
            provinciaid: Number(formData.provinciaid) || 0,
            momento: ahora,
          };
          delete payloadRel.ProvinciaID;
          await tercerosService.actualizarRelacionDeSocio(payloadRel);
          relacionGuardada = payloadRel;
          toast.success(`${etiquetaRol} actualizado correctamente.`);
        } else {
          const payloadRel = {
            socioid: socioIdActivo,
            tercerosrelacionados: [
              {
                sociotercerorelacionid: 0,
                socioid: socioIdActivo,
                terceroid: terceroId,
                tiporelacionsocioid: targetRolId,
                fechadesde: ahora,
                fechahasta: unAnioMasStr,
                porcacciones: 0,
                nroinscripcion: "",
                condicionescomerciales: "",
                cbu: "",
                nrosubcuentacaja: "",
                sucursalid: 0,
                default: "0",
                subtiporelacionsocioid: 0,
                telefono: formData.telefono || "",
                provinciaid: Number(formData.provinciaid) || 0,
                momento: ahora,
              },
            ],
          };
          await tercerosService.guardarRelacionesDeSocio(payloadRel);
          toast.success(`${etiquetaRol} agregado correctamente.`);

          // El POST no devuelve el sociotercerorelacionid asignado - se
          // refresca una vez para poder identificar la relación recién
          // creada en la próxima edición (ver onGuardar más abajo).
          try {
            const relacionesPost = await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
            const arrRelPost = Array.isArray(relacionesPost) ? relacionesPost : relacionesPost?.data || [];
            relacionGuardada = arrRelPost.find(
              (r) =>
                Number(r.terceroid || r.tercerorelacionadoid || r.TerceroRelacionadoID) === Number(terceroId) &&
                [210, 230].includes(Number(r.tiporelacionsocioid || r.TipoRelacionSocioID || r.tiporelacionsocioId)),
            );
          } catch (postRelErr) {
            console.warn("[RepresentanteModal] No se pudo refrescar la relación recién creada:", postRelErr);
          }
        }
      }

      // If we are in Form Mode (Wizard), propagate to react-hook-form state.
      // El payload incluye domicilio/id/relacion (no solo cuit/nombre/rol/
      // email/celular) porque este objeto reemplaza por completo la entrada
      // anterior en el field array del wizard (ver Paso5Documentacion /
      // AltaOperacion) - si se omite acá, se pierde la ubicación cargada al
      // reabrir el modal más tarde en la misma sesión, y `onConfirmSave`
      // deja de poder distinguir "editar" de "crear" en la próxima vuelta
      // (necesita `id` + `relacion.sociotercerorelacionid` para no duplicar
      // la relación).
      if (onGuardar) {
        onGuardar({
          id: terceroId,
          cuit: cuitLimpio,
          nombre: formData.nombre,
          rol: formData.rol,
          email: formData.email,
          celular: formData.telefono,
          direccion: formData.direccion || formData.calle || "",
          calle: formData.calle || "",
          numero: Number(formData.numero) || 0,
          piso: formData.piso || "",
          departamento: formData.departamento || "",
          ciudadid: Number(formData.ciudadid) || 0,
          codpos: formData.codpos || "",
          provinciaid: formData.provinciaid || "",
          preloadedFromDb: true,
          relacion: relacionGuardada || undefined,
        });
      }

      // No se espera a onSuccess (cargarSocios en SociosLegajo.jsx puede
      // tardar unos segundos en refetchear todo de verdad) — la modal se
      // cierra ya mismo y la sección de representantes/apoderados queda en
      // su propio estado de carga ("actualizando") hasta que el refresh
      // termine, en vez de retener la modal abierta esperando.
      if (onSuccess) onSuccess();
      setShowConfirm(false);
      onClose();
    } catch (error) {
      setShowConfirm(false);
      if (error?.response?.status === 400 && error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          setError(key, { type: "server", message: backendErrors[key] });
        });
        toast.error("Por favor, revisá los errores en el formulario.");
      } else {
        toast.error("Ocurrió un error inesperado al guardar los datos.");
      }
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={representante || representanteInicial ? `Editar ${etiquetaRol}` : `Agregar ${etiquetaRol}`}
        maxWidth="800px"
        variant={isAdmin ? "blue" : "default"}
      >
        <form onSubmit={handlePreSubmit} className={styles.modalForm}>
          {!afipValidado && !representante && !representanteInicial ? (
            <div className={styles.cuitSearchStep}>
              <div className={`${styles.cuitSearchBanner} ${isAdmin ? styles.cuitSearchBannerAdmin : ""}`}>
                <div className={`${styles.cuitSearchBannerIcon} ${isAdmin ? styles.cuitSearchBannerIconAdmin : ""}`}>
                  <FiShield />
                </div>
                <div className={styles.cuitSearchBannerText}>
                  <p className={styles.cuitSearchBannerTitle}>Validación segura con AFIP</p>
                  <p className={styles.cuitSearchBannerSub}>Ingresá el CUIT para autocompletar los datos del {etiquetaRol.toLowerCase()}</p>
                </div>
              </div>
              <div className={styles.cuitSearchInputWrapper}>
                <BuscadorCuit
                  name="cuit"
                  control={control}
                  label={`CUIT del ${etiquetaRol.toLowerCase()}`}
                  onValidar={handleAfipLookup}
                  error={errors.cuit?.message}
                  esValido={String(cuitValue || "").replace(/\D/g, "").length === 11}
                  buttonText="VALIDAR CUIT"
                  isLoading={validando}
                />
              </div>
            </div>
          ) : (
            <>
              <div className={styles.summaryCard}>
                <div className={styles.summaryTop}>
                  <div className={styles.summaryLeft}>
                    <span className={styles.summaryStatus}>
                      {enriqueciendoAuto ? (
                        <>
                          <Spinner size={10} style={{ marginRight: "0.25rem", display: "inline-block", verticalAlign: "middle" }} />
                          Enriqueciendo datos...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle size={11} /> {etiquetaRol} validado con AFIP
                        </>
                      )}
                    </span>
                    <h2 className={styles.summaryName}>{nombreValue || etiquetaRol}</h2>
                    <p className={styles.summaryCuit}>CUIT: {cuitValue}</p>
                    {representante || representanteInicial ? (
                      <button
                        type="button"
                        className={styles.editLink}
                        onClick={handleAfipLookup}
                        disabled={validando || enriqueciendoAuto}
                      >
                        <FiEdit2 size={12} /> {validando ? "Buscando..." : "Consultar AFIP"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.editLink}
                        onClick={() => setAfipValidado(false)}
                      >
                        <FiEdit2 size={12} /> Cambiar CUIT
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.modalRow}>
                <Controller
                  name="nombre"
                  control={control}
                  rules={{ required: "El nombre es obligatorio" }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("nombre", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Nombre Completo"
                      icon={<FiUser />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className={styles.modalRow2}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: "El email es obligatorio",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("email", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Correo Electrónico"
                      icon={<FiMail />}
                      error={fieldState.error?.message}
                      tooltip="Email personal del representante. Se utilizará para el envío y firma digital de contratos y documentos legales."
                    />
                  )}
                />

                <Controller
                  name="telefono"
                  control={control}
                  rules={{ required: "El teléfono es obligatorio" }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("telefono", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Celular / Teléfono (Sin 0 ni 15)"
                      mask={[{ mask: "00 0000-0000" }, { mask: "000 000-0000" }]}
                      icon={<FiPhone />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              {/* Mismos campos de domicilio que SocioAccionistaModal —
                  cuando esta misma persona ya es accionista, se precargan
                  solos desde el tercero existente (ver handleAfipLookup),
                  para que quede consistente entre los dos roles. */}
              <h4 className={styles.sectionTitle}>Domicilio</h4>

              <div className={styles.modalRow}>
                <Controller
                  name="calle"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("calle", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Calle / Avenida"
                      icon={<FiMapPin />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className={styles.modalRow3}>
                <Controller
                  name="numero"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("numero", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Número"
                      type="number"
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="piso"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("piso", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Piso"
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="departamento"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("departamento", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Depto / Of."
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className={styles.modalRow3}>
                <Controller
                  name="provinciaid"
                  control={control}
                  render={({ fieldState }) => (
                    <SelectSocio
                      control={control}
                      name="provinciaid"
                      label={cargandoProvincias ? "Cargando provincias..." : "Provincia"}
                      icon={<FiMapPin />}
                      options={opcionesProvincias}
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="ciudadid"
                  control={control}
                  render={({ fieldState }) => (
                    <SelectSocio
                      control={control}
                      name="ciudadid"
                      label={cargandoCiudades ? "Cargando..." : "Ciudad"}
                      icon={<FiMap />}
                      options={opcionesCiudades}
                      isLoading={cargandoCiudades}
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="codpos"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("codpos", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Código Postal"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            </>
          )}

          <div className={`${styles.modalFooter} ${isAdmin ? styles.modalFooterAdmin : ""}`}>
            {(afipValidado || representante || representanteInicial) && (
              <Button type="submit" variant={isAdmin ? "blue" : "primary"} isLoading={validando} disabled={validando}>
                {representante || representanteInicial ? "Guardar Cambios" : `Agregar ${etiquetaRol}`}
              </Button>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmacionModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmSave}
        titulo={representante || representanteInicial ? `Actualizar ${etiquetaRol}` : `Agregar ${etiquetaRol}`}
        mensaje={representante || representanteInicial ? "¿Estás seguro de que deseas guardar los cambios?" : `¿Estás seguro de que deseas agregar este ${etiquetaRol.toLowerCase()}?`}
      />

      <ProcesamientoModal
        isOpen={procesoModal.isOpen}
        onClose={() => {
          setProcesoModal(prev => ({ ...prev, isOpen: false }));
          if (cdaContinuarResolveRef.current) {
            cdaContinuarResolveRef.current();
            cdaContinuarResolveRef.current = null;
          }
        }}
        titulo={procesoModal.titulo}
        pasos={procesoModal.pasos}
        hasError={procesoModal.hasError}
        isSystemError={procesoModal.isSystemError}
        onRetry={handleAfipLookup}
      />
    </>
  );
}
