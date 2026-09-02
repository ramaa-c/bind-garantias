import React, { useState, useEffect } from "react";

import { useRequisitos } from "../../../../hooks/useRequisitos";
import {
  useFormContext,
  useFormState,
  useWatch,
  useFieldArray,
} from "react-hook-form";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiEdit2,
  FiChevronRight,
  FiPlus,
  FiTrash2,
  FiMail,
} from "react-icons/fi";
import { toast } from "sonner";
import { Button, InputSocioMasked } from "../../../ui";
import {
  DocumentosEmpresaModal,
  RepresentanteLegalModal,
  ApoderadoModal,
} from "../../../features";
import { useProvincias } from "../../../../hooks/useCatalogos";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { tercerosService } from "../../../../services/tercerosService";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { formatBase64Size } from "../../../../utils/fileUtils";
import { matchProvinciaAfip } from "../../../../utils/provinciaUtils";
import styles from "./Paso5Documentacion.module.css";
import { useCadenaActiva } from "../../../../hooks/useCadenaActiva";


const DOC_ITEMS = [
  { key: "estatuto", label: "Estatuto Social" },
  { key: "eecc", label: "Estados Contables (EECC)" },
  { key: "balance", label: "Balance de Sumas y Saldos" },
  { key: "ddjjIva", label: "Declaración Jurada de IVA" },
  { key: "poderes", label: "Poderes" },
  { key: "certificadoPyme", label: "Certificado PyME" },
  { key: "actaDesignacion", label: "Acta de Designación de Autoridades" },
  { key: "actaSocios", label: "Acta de Reunión de Socios" },
  { key: "f1272", label: "Formulario F1272" },
  { key: "ddjjGanancias", label: "DDJJ de Ganancias" },
  { key: "manifestacionBienes", label: "Manifestación de Bienes" },
  { key: "constanciaMonotributo", label: "Constancia de Monotributo" },
  { key: "cartasDocumento", label: "Cartas Documento" },
  { key: "otrosDocumentos", label: "Otros Documentos" },
];

const PersistenciaOculta = ({ register, socios = [], representantes = [] }) => (
  <div style={{ display: "none" }}>
    <input {...register("emailFacturacion")} />
    {socios.map((socio, i) => (
      <React.Fragment key={socio?.cuit || i}>
        <input {...register(`socios.${i}.email`)} />
        <input {...register(`socios.${i}.celular`)} />
        <input {...register(`socios.${i}.direccion`)} />
        <input {...register(`socios.${i}.provincia`)} />
        <input {...register(`socios.${i}.localidad`)} />
      </React.Fragment>
    ))}
    {representantes.map((rep, i) => (
      <React.Fragment key={rep?.id || i}>
        <input {...register(`representantes.${i}.cuit`)} />
        <input {...register(`representantes.${i}.nombre`)} />
        <input {...register(`representantes.${i}.rol`)} />
        <input {...register(`representantes.${i}.email`)} />
        <input {...register(`representantes.${i}.celular`)} />
      </React.Fragment>
    ))}
  </div>
);

export default function Paso5Documentacion({
  socios = [],
  avanzarPaso6,
  isSubmitting,
  socioId,
}) {
  const { cadenaSlug } = useCadenaActiva();
  const cadenaId = Number(cadenaSlug) || 1;

  const { tipoPersonaId, nombreEmpresa } = useEmpresaActiva();
  const { requisitos } = useRequisitos(cadenaId, tipoPersonaId, nombreEmpresa);
  const esPersonaFisica = Number(tipoPersonaId) === 1;

  // Apoderado (210) y Representante Legal (230) son requisitos
  // independientes desde la parametrización (ver requisitosService.js) -
  // esta sección todavía junta la carga de ambos roles en un solo bloque
  // (a diferencia del Legajo, que ya tiene una pestaña propia por rol), así
  // que se combinan acá: se muestra/exige si cualquiera de los dos aplica.
  const requisitoApoderados = requisitos?.relaciones?.apoderados;
  const requisitoRepLegal = esPersonaFisica ? 0 : requisitos?.relaciones?.representanteLegal;
  const mostrarApoderado = requisitoApoderados !== 0;
  const mostrarRepLegal = requisitoRepLegal !== 0;
  const mostrarSeccionReps = mostrarApoderado || mostrarRepLegal;
  const repRequerido = requisitoApoderados === 1 || requisitoRepLegal === 1;

  const docItemsFiltered = DOC_ITEMS.filter(({ key }) => {
    const configVal = requisitos?.documentos?.[key];
    return configVal !== 0; // 0 = no mostrar
  });
  const { register, control, setValue, trigger, getValues } =
    useFormContext();
  const { errors } = useFormState({ control });
  const {
    fields: representantes,
    append: appendRep,
    update: updateRep,
    remove: removeRep,
  } = useFieldArray({ control, name: "representantes" });

  const { data: provinciasData } = useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];

  const [archivosBackend, setArchivosBackend] = useState([]);

  const [uiState, setUiState] = useState({
    archivos: {},
    socioActivoIndex: null,
    repActivoIndex: null,
    modalDocsOpen: false,
    modalRepTipo: null, // null | "legal" | "apoderado"
    draggingKey: null,
    backupSocio: {},
    backupArchivos: {},
    intentoAvanzar: false,
    intentoGuardarSocio: false,
    isGuardando: false,
  });

  useEffect(() => {
    if (!socioId) return;
    const cargarArchivosBackend = async () => {
      try {
        const archivosExistentes =
          await socioArchivoService.obtenerArchivos(socioId);
        const arr = Array.isArray(archivosExistentes) ? archivosExistentes : [];
        setArchivosBackend(arr);

        if (arr.length > 0) {
          const tipoToKey = {};
          Object.entries(socioArchivoService.TIPO_DOCUMENTO_MAP).forEach(
            ([key, id]) => {
              tipoToKey[id] = key;
            },
          );

          const archivosRecuperados = {};
          arr.forEach((arch) => {
            const docKey = tipoToKey[arch.tipodocumentoarchivoid];
            if (
              docKey &&
              Object.keys(socioArchivoService.TIPO_DOCUMENTO_MAP).includes(docKey)
            ) {
              // Crear un pseudo-File para mostrar en la UI
              const pseudoFile = new File(
                [""],
                arch.nombrearchivo || "archivo",
                {
                  type: "application/octet-stream",
                },
              );
              pseudoFile.formattedSize = arch.contenido ? formatBase64Size(arch.contenido) : "Disponible";
              pseudoFile._uploaded = true;
              pseudoFile._backendId = arch.socioarchivoid;
              pseudoFile.vialufe = arch.vialufe || arch.Vialufe || "0";
              archivosRecuperados[docKey] = pseudoFile;
            }
          });

          if (Object.keys(archivosRecuperados).length > 0) {
            setUiState((prev) => ({
              ...prev,
              archivos: { ...archivosRecuperados, ...prev.archivos },
            }));
          }
        }
      } catch (err) {
        console.warn("No se pudieron cargar archivos existentes:", err);
      }
    };
    cargarArchivosBackend();
  }, [socioId]);

  const {
    archivos,
    repActivoIndex,
    modalDocsOpen,
    modalRepTipo,
    intentoAvanzar,
  } = uiState;

  const updateState = (updates) => {
    setUiState((prev) => ({
      ...prev,
      ...(typeof updates === "function" ? updates(prev) : updates),
    }));
  };

  const emailFacturacionVal =
    useWatch({ control, name: "emailFacturacion" }) || "";

  React.useEffect(() => {
    if (!socios.length) return;

    const provincias = opcionesProvincias || [];

    socios.forEach((socio, index) => {
      const original = socio?.dataOriginal || {};
      const dg = original.datosgenerales;
      const dom = dg ? dg.domiciliofiscal || {} : {};
      const current = getValues(`socios.${index}`) || {};

      const updates = {};

      if (!current.email) {
        const email =
          (dg && (dg.email || dg.emailfacturacion)) ||
          original.mail ||
          original.Mail ||
          "";
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          updates.email = email;
        }
      }

      if (!current.celular) {
        const tel = original.telefono || original.Telefono || "";
        if (tel) updates.celular = tel;
      }

      if (!current.direccion) {
        const dir =
          dom.direccion ||
          (dg && dg.calle ? `${dg.calle} ${dg.numero || ""}`.trim() : "") ||
          original.calle ||
          original.Calle ||
          original.direccion ||
          original.Direccion ||
          "";
        if (dir) updates.direccion = dir;
      }

      if (!current.localidad) {
        const loc =
          dom.localidad || original.localidad || original.Localidad || "";
        if (loc) updates.localidad = loc;
      }

      if (!current.provincia) {
        const provNombre =
          dom.descripcionprovincia ||
          original.provincia ||
          original.Provincia ||
          "";
        if (provNombre) {
          const match = matchProvinciaAfip(provNombre, provincias);
          if (match) {
            updates.provincia = match.value;
          }
        } else if (original.provinciaid || original.ProvinciaId) {
          updates.provincia = original.provinciaid || original.ProvinciaId;
        }
      }

      if (Object.keys(updates).length > 0) {
        Object.keys(updates).forEach((key) => {
          setValue(`socios.${index}.${key}`, updates[key]);
        });
      }
    });
  }, [socios, getValues, setValue, opcionesProvincias]);

  // ── handlers  ──────────────────────────────────────────────────
  const handleFileUpload = (key, file) => {
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      updateState((prev) => ({
        archivos: {
          ...prev.archivos,
          [key]: Object.assign(file, { formattedSize: sizeMB }),
        },
      }));
    }
  };

  const handleFileRemove = (key) => {
    updateState((prev) => {
      const nuevos = { ...prev.archivos };
      delete nuevos[key];
      return { archivos: nuevos };
    });
  };

  const docsEmpresaListos = docItemsFiltered.every(({ key }) => {
    const configVal = requisitos?.documentos?.[key];
    if (configVal === 1) {
      return !!archivos[key];
    }
    return true; // Si es opcional (2) o no visible, no bloquea el avance
  });

  const handleAbrirModalRep = (index, tipo) =>
    updateState({ repActivoIndex: index, modalRepTipo: tipo });
  const handleGuardarRep = (repData) =>
    repActivoIndex !== null
      ? updateRep(repActivoIndex, repData)
      : appendRep(repData);

  const handleEliminarRep = async (index) => {
    const rep = representantes[index];
    const cuitLimpio = String(rep?.cuit || "").replace(/\D/g, "");

    if (socioId && cuitLimpio) {
      try {
        const existentes = await tercerosService.obtenerTerceros({
          Cuit: cuitLimpio,
        });
        const arrTerceros = Array.isArray(existentes)
          ? existentes
          : existentes?.data || [];
        const terceroId =
          arrTerceros[0]?.tercerorelacionadoid ||
          arrTerceros[0]?.TerceroRelacionadoID ||
          arrTerceros[0]?.id;

        if (terceroId) {
          const relaciones =
            await tercerosService.obtenerRelacionesDeSocio(socioId);
          const arrRel = Array.isArray(relaciones)
            ? relaciones
            : relaciones?.data || [];
          const relacionActiva = arrRel.find(
            (r) =>
              Number(
                r.terceroid || r.tercerorelacionadoid || r.TerceroRelacionadoID,
              ) === Number(terceroId) &&
              [210, 230].includes(
                Number(
                  r.tiporelacionsocioid ||
                    r.TipoRelacionSocioID ||
                    r.tiporelacionsocioId,
                ),
              ),
          );

          if (relacionActiva) {
            const ayer = new Date();
            ayer.setDate(ayer.getDate() - 1);
            const ayerStr = ayer.toISOString().split(".")[0];
            const payload = {
              ...relacionActiva,
              fechahasta: ayerStr,
              FechaHasta: ayerStr,
            };
            delete payload.provinciaid;
            delete payload.ProvinciaID;
            await tercerosService.actualizarRelacionDeSocio(payload);
            toast.success(
              `${rep?.rol || "Representante"} desvinculado correctamente.`,
            );
          }
        }
      } catch (err) {
        console.error("Error al desvincular representante:", err);
        toast.error(
          "Ocurrió un error al intentar desvincular al representante.",
        );
        return;
      }
    }

    removeRep(index);
  };

  const handleAvanzarClick = async () => {
    updateState({ intentoAvanzar: true });
    const isRepRequired = repRequerido;
    const tieneRepresentantes = representantes.length > 0;
    const canAdvanceReps = !isRepRequired || tieneRepresentantes;

    const emailFacValido = await trigger("emailFacturacion");
    if (
      docsEmpresaListos &&
      canAdvanceReps &&
      emailFacValido &&
      emailFacturacionVal.trim() !== ""
    ) {
      if (avanzarPaso6) avanzarPaso6();
    } else if (!canAdvanceReps && isRepRequired) {
      toast.error("Debe declarar al menos un representante o apoderado.");
    }
  };

  const errorEmailFacturacion =
    errors.emailFacturacion?.message ||
    (intentoAvanzar && emailFacturacionVal.trim() === ""
      ? "Obligatorio"
      : null);
  const isEmailFacturacionValido =
    !errorEmailFacturacion && emailFacturacionVal.trim() !== "";

  // La sección de representantes/apoderados se MUESTRA cada vez que
  // mostrarSeccionReps es true (para poder cargar/corregir uno si hace
  // falta), pero solo cuenta como una tarea pendiente del progreso cuando
  // es realmente obligatoria (repRequerido) - si es opcional (Requerimiento
  // = 2 en CadenaValorParametrizacion), no debe contarse como "falta" solo
  // porque está vacía.
  const totalTareas = repRequerido ? 3 : 2;
  const tareasCompletas =
    (docsEmpresaListos ? 1 : 0) +
    (repRequerido && representantes.length > 0 ? 1 : 0) +
    (isEmailFacturacionValido ? 1 : 0);
  const progresoPct = (tareasCompletas / totalTareas) * 100;

  return (
    <div className={styles.container}>
      {/* PROGRESO ────────────────────────────────────────────────────────────── */}
      <div className={styles.progressRow}>
        <span className={styles.progressLabel}>
          {tareasCompletas} de {totalTareas} completado
          {tareasCompletas === 1 ? "" : "s"}
        </span>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${progresoPct === 100 ? styles.progressFillDone : ""}`}
            style={{ transform: `scaleX(${progresoPct / 100})` }}
          />
        </div>
      </div>

      {/* GRID ────────────────────────────────────────────────────────────────── */}
      <div className={styles.grid}>
        {/* DOCUMENTACIÓN */}
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionLabel}>Documentación Legal</span>
            <button
              type="button"
              className={`${styles.actionLink} ${docsEmpresaListos ? styles.actionLinkEdit : intentoAvanzar ? styles.actionLinkError : ""}`}
              onClick={() => updateState({ modalDocsOpen: true })}
            >
              {docsEmpresaListos ? (
                <>
                  <FiEdit2 size={11} /> Modificar
                </>
              ) : (
                <>Cargar documentos →</>
              )}
            </button>
          </div>
          <div
            className={styles.docGrid}
            onClick={() => updateState({ modalDocsOpen: true })}
          >
            {docItemsFiltered.map(({ key, label }) => {
              const isRequired = requisitos?.documentos?.[key] === 1;
              return (
                <div
                  key={key}
                  className={`${styles.docChip} ${
                    archivos[key]
                      ? styles.docChipDone
                      : (isRequired && intentoAvanzar)
                        ? styles.docChipError
                        : styles.docChipPending
                  }`}
                >
                  {archivos[key] ? (
                    <FiCheckCircle size={12} />
                  ) : (
                    <FiAlertCircle size={12} />
                  )}
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </section>



        {/* REPRESENTANTES */}
        {mostrarSeccionReps && (
          <section className={styles.section}>
            <div className={styles.sectionHeaderRow}>
              <span className={styles.sectionLabel}>
                Representantes y Apoderados
                {!repRequerido && (
                  <span className={styles.countBadge}> · Opcional</span>
                )}
              </span>
              {representantes.length > 0 && (
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {mostrarRepLegal && (
                    <button
                      type="button"
                      className={styles.actionLink}
                      onClick={() => handleAbrirModalRep(null, "legal")}
                    >
                      <FiPlus size={11} /> Repr. Legal
                    </button>
                  )}
                  {mostrarApoderado && (
                    <button
                      type="button"
                      className={styles.actionLink}
                      onClick={() => handleAbrirModalRep(null, "apoderado")}
                    >
                      <FiPlus size={11} /> Apoderado
                    </button>
                  )}
                </div>
              )}
            </div>

            {representantes.length === 0 ? (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {mostrarRepLegal && (
                  <button
                    type="button"
                    className={`${styles.emptySlot} ${intentoAvanzar && repRequerido ? styles.emptySlotError : ""}`}
                    style={{ flex: 1 }}
                    onClick={() => handleAbrirModalRep(null, "legal")}
                  >
                    <FiPlus size={14} />
                    <span>Agregar representante legal</span>
                  </button>
                )}
                {mostrarApoderado && (
                  <button
                    type="button"
                    className={`${styles.emptySlot} ${intentoAvanzar && repRequerido ? styles.emptySlotError : ""}`}
                    style={{ flex: 1 }}
                    onClick={() => handleAbrirModalRep(null, "apoderado")}
                  >
                    <FiPlus size={14} />
                    <span>Agregar apoderado</span>
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.compactList}>
                {representantes.map((rep, index) => (
                  <div
                    key={rep?.id || index}
                    className={`${styles.compactRow} ${styles.compactRowSuccess}`}
                  >
                    <span className={`${styles.statusDot} ${styles.dotGreen}`} />
                    <div className={styles.rowInfo}>
                      <strong className={styles.rowName}>{rep.nombre}</strong>
                      <span className={styles.rowSub}>
                        {rep.rol} · {rep.cuit}
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() =>
                          handleAbrirModalRep(
                            index,
                            rep.rol === "Representante Legal" ? "legal" : "apoderado",
                          )
                        }
                        title="Editar"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => handleEliminarRep(index)}
                        title="Eliminar"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* EMAIL FACTURACIÓN */}
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionLabel}>Email de Facturación</span>
            {isEmailFacturacionValido && (
              <span className={styles.validBadge}>
                <FiCheckCircle size={11} /> Configurado
              </span>
            )}
          </div>
          <InputSocioMasked
            control={control}
            name="emailFacturacion"
            label="Dirección de correo electrónico"
            icon={<FiMail />}
            type="email"
            error={errorEmailFacturacion}
            esValido={isEmailFacturacionValido}
            tooltip="Email a donde se enviarán todos los comprobantes, facturas contables y liquidaciones de la empresa."
          />
        </section>
      </div>

      {/* FOOTER ──────────────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <Button
          variant="primary"
          size="md"
          onClick={handleAvanzarClick}
          className={styles.continueBtn}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "ENVIANDO..." : "CONTINUAR"}
        </Button>
      </div>

      {/* MODALS ──────────────────────────────────────────────────────────────── */}
      <DocumentosEmpresaModal
        isOpen={modalDocsOpen}
        onClose={() => updateState({ modalDocsOpen: false })}
        archivos={archivos}
        onFileUpload={handleFileUpload}
        onFileRemove={handleFileRemove}
        intentoAvanzar={intentoAvanzar}
        socioId={socioId}
        archivosBackend={archivosBackend}
        onArchivosBackendChange={setArchivosBackend}
        requisitos={requisitos}
      />

      <RepresentanteLegalModal
        isOpen={modalRepTipo === "legal"}
        onClose={() =>
          updateState({ modalRepTipo: null, repActivoIndex: null })
        }
        representanteInicial={
          modalRepTipo === "legal" && repActivoIndex !== null
            ? representantes[repActivoIndex]
            : null
        }
        socioIdActivo={socioId}
        onGuardar={handleGuardarRep}
      />
      <ApoderadoModal
        isOpen={modalRepTipo === "apoderado"}
        onClose={() =>
          updateState({ modalRepTipo: null, repActivoIndex: null })
        }
        representanteInicial={
          modalRepTipo === "apoderado" && repActivoIndex !== null
            ? representantes[repActivoIndex]
            : null
        }
        socioIdActivo={socioId}
        onGuardar={handleGuardarRep}
      />
      <PersistenciaOculta
        register={register}
        socios={socios}
        representantes={representantes}
      />
    </div>
  );
}
