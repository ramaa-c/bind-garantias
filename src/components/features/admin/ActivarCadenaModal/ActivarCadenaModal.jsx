import React, { useState, useRef } from "react";
import { FiSearch, FiArrowLeft, FiChevronRight, FiPower, FiHash, FiBriefcase, FiFileText, FiDollarSign } from "react-icons/fi";
import { toast } from "sonner";
import { useObtenerCadenasCursanPlataforma, useCrearCadenaValor } from "../../../../hooks/useCadenaValor";
import { esCadenaAprobadaYVigente } from "../../../../utils/cadenaValorUtils";
import { useTipoCanalComercializacion, useEquipoComercial, useTipoContrato, useMonedas, useTipoModeloDocumento } from "../../../../hooks/useCatalogos";
import { useModelosDocumentoDisponibles } from "../../../../hooks/useModeloDocumento";
import { filtrarTiposModeloDocumento } from "../../../../utils/parametrosModeloDocumento";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { InputSimple } from "../../../ui/InputSimple/InputSimple";
import { SelectSimple } from "../../../ui/SelectSimple/SelectSimple";
import { MontoEnPalabras } from "../../../ui/MontoEnPalabras/MontoEnPalabras";
import { Skeleton } from "../../../ui/Skeleton/Skeleton";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import { SeccionCadena, PasosActivacion, CargaLogoCadena } from "../FormularioCadena/FormularioCadena";
import f from "../FormularioCadena/FormularioCadena.module.css";
import { obtenerInicialesEmpresa } from "../../../../utils/empresaAvatar";
import { ConfirmacionModal } from "../../shared/ConfirmacionModal/ConfirmacionModal";
import {
  requisitosService,
  DEFAULT_PHYSICAL_CONFIG,
  DEFAULT_SA_CONFIG,
  DEFAULT_SRL_CONFIG,
  DEFAULT_SH_CONFIG,
  DEFAULT_OTRAS_CONFIG,
} from "../../../../services/requisitosService";
import { FORMATOS_ARCHIVO, validarTipoArchivo } from "../../../../utils/fileUtils";
import { mensajeNegocio } from "../../../../utils/mensajesError";

export const ActivarCadenaModal = ({ isOpen, onClose, activeList, onSuccess }) => {
  const [step, setStep] = useState("select"); // "select" or "form"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState(null);
  const [formState, setFormState] = useState({
    cadenavalorid: 0,
    denominacion: "",
    referencia: "",
    logo: "",
    tipocanalcomercializacionid: "",
    equipocomercialid: "",
    tipocontratoid: "",
    monedaid: "",
    montomaximoutilizado: "0",
    porcentajemaximoutilizado: "100",
    modelodocumentoid: "0",
  });

  // Solo sirve para filtrar el combo de Modelo - no se persiste (mismo
  // criterio que en EditarCadenaModal.jsx).
  const [tipoModeloDocumentoIdUI, setTipoModeloDocumentoIdUI] = useState("");

  // Mismo patrón que LineasCadena.jsx: cada campo obligatorio muestra su
  // propio error debajo (InputSimple/SelectSimple ya lo soportan) en vez de
  // un toast que desaparece solo y no señala qué campo hay que corregir.

  const fileInputRef = useRef(null);

  // Bloque numérico compartido por los inputs enmascarados de Monto/Porcentaje
  // Máximo Utilizado: coma como separador decimal (es-AR).
  const bloqueNumerico = (max) => ({
    mask: Number,
    scale: 2,
    signed: false,
    min: 0,
    ...(max !== undefined ? { max } : {}),
    thousandsSeparator: ".",
    padFractionalZeros: true,
    normalizeZeros: true,
    radix: ",",
    mapToRadix: ["."],
  });

  const desenmascarar = (val) => {
    if (typeof val !== "string") return val;
    return val.replace(/[^0-9,]/g, "").replace(",", ".");
  };

  const handleInputChange = (field, val) => {
    setFormState((prev) => ({ ...prev, [field]: val }));
  };

  // Queries & Mutations
  const { data: todasCadenasData, isLoading: isLoadingTodas } = useObtenerCadenasCursanPlataforma();
  const { data: canalesData } = useTipoCanalComercializacion();
  const { data: equiposData } = useEquipoComercial();
  const { data: contratosData } = useTipoContrato();
  const { data: monedasData } = useMonedas();
  const { data: tiposModeloDocumentoData } = useTipoModeloDocumento();
  const {
    opciones: modelosDocumentoOpciones,
    cargando: cargandoModelosDocumento,
    ocultos: modelosDocumentoOcultos,
  } = useModelosDocumentoDisponibles(tipoModeloDocumentoIdUI, formState.modelodocumentoid);
  const crearMutation = useCrearCadenaValor();

  const canalesOpciones = canalesData?.opciones || [];
  const equiposOpciones = equiposData?.opciones || [];
  const contratosOpciones = contratosData?.opciones || [];
  const monedasOpciones = monedasData?.opciones || [];
  const tiposModeloDocumentoOpciones = filtrarTiposModeloDocumento(
    tiposModeloDocumentoData?.opciones,
    tipoModeloDocumentoIdUI,
  );

  const [confirmOpen, setConfirmOpen] = useState(false);

  const todasList = Array.isArray(todasCadenasData)
    ? todasCadenasData
    : todasCadenasData?.items || todasCadenasData?.data || [];

  // Solo se puede activar en la web una cadena Aprobada y con vigencia vigente.
  const cadenasHabilitadas = todasList.filter(esCadenaAprobadaYVigente);

  const activeIds = new Set(activeList.map(c => c.cadenavalorid));
  const inactiveCadenas = cadenasHabilitadas.filter(c => !activeIds.has(c.cadenavalorid));

  const filteredInactive = inactiveCadenas.filter(c =>
    c.denominacion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(c.cadenavalorid).includes(searchQuery)
  );

  const handleSelectChain = (chain) => {
    setSelectedChain(chain);

    // La moneda de la cadena viene del CORE (SGR+) como texto ("Pesos
    // Argentinos", "Dolares Estadounidenses"), no como MonedaID - se
    // preselecciona matcheando ese texto contra catalogos/Moneda.Descripcion.
    // El admin puede corregirla si no matchea.
    const monedaCore = (chain.moneda || "").trim().toLowerCase();
    const monedaMatch = monedasData?.raw?.find(
      (m) => (m.descripcion || "").trim().toLowerCase() === monedaCore,
    );

    setFormState({
      cadenavalorid: chain.cadenavalorid,
      denominacion: chain.denominacion,
      referencia: chain.referencia || "",
      logo: chain.logo || "",
      tipocanalcomercializacionid: chain.tipocanalcomercializacionid != null ? chain.tipocanalcomercializacionid.toString() : "",
      equipocomercialid: chain.equipocomercialid != null ? chain.equipocomercialid.toString() : "",
      tipocontratoid: chain.tipocontratoid != null ? chain.tipocontratoid.toString() : "",
      monedaid: monedaMatch ? String(monedaMatch.monedaid) : "",
      montomaximoutilizado: "0",
      porcentajemaximoutilizado: "100",
      modelodocumentoid: "0",
    });
    setTipoModeloDocumentoIdUI("");
    setStep("form");
  };

  // Cambiar el tipo invalida el modelo elegido previamente (los modelos de
  // otro tipo no son válidos acá).
  const handleTipoModeloDocumentoChange = (val) => {
    setTipoModeloDocumentoIdUI(val);
    handleInputChange("modelodocumentoid", "0");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!validarTipoArchivo(file, FORMATOS_ARCHIVO.imagen)) return;
      if (file.size > 500 * 1024) {
        toast.error("El tamaño máximo permitido para la imagen es 500kb");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1] || reader.result;
        setFormState(prev => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Sin toast genérico: cada campo obligatorio muestra su propio error
  // debajo (mismo patrón que ya usa LineasCadena.jsx), así se ve de un
  // vistazo qué falta en vez de un mensaje flotante que desaparece solo.
  const validarFormulario = () => {
    const errores = {};

    if (!formState.tipocanalcomercializacionid) {
      errores.tipocanalcomercializacionid = "Seleccioná un canal";
    }
    if (!formState.equipocomercialid) {
      errores.equipocomercialid = "Seleccioná un equipo comercial";
    }
    if (!formState.tipocontratoid) {
      errores.tipocontratoid = "Seleccioná un tipo de contrato";
    }
    if (!formState.monedaid) {
      errores.monedaid = "Seleccioná una moneda";
    }

    // Si todavía no hay moneda elegida, el input de monto está deshabilitado
    // (ver el hint que se muestra en su lugar) - no tiene sentido duplicar el
    // reclamo con un error superpuesto en el mismo espacio reservado.
    if (formState.monedaid) {
      const montoUtilizadoLimpio = desenmascarar(formState.montomaximoutilizado);
      if (montoUtilizadoLimpio === "" || isNaN(Number(montoUtilizadoLimpio)) || Number(montoUtilizadoLimpio) <= 0) {
        errores.montomaximoutilizado = "Ingresá un monto válido";
      }
    }

    const porcentajeLimpio = desenmascarar(formState.porcentajemaximoutilizado);
    if (porcentajeLimpio === "" || isNaN(Number(porcentajeLimpio)) || Number(porcentajeLimpio) <= 0 || Number(porcentajeLimpio) > 100) {
      errores.porcentajemaximoutilizado = "Ingresá un porcentaje válido (0 a 100)";
    }

    return errores;
  };

  const errorPendiente = Object.values(validarFormulario())[0];

  const handleSave = () => {
    if (errorPendiente) return;
    setConfirmOpen(true);
  };

  const confirmSave = () => {
    const parseMonto = (obj) => {
      if (!obj) return 0;
      const key = Object.keys(obj).find(
        (k) =>
          k.toLowerCase() === "montomaximocv" ||
          k.toLowerCase() === "montomaximo" ||
          k.toLowerCase() === "tope" ||
          k.toLowerCase() === "monto_maximo"
      );
      return parseFloat(obj[key] || 0);
    };

    const payload = {
      cadenavalorid: Number(formState.cadenavalorid),
      denominacion: formState.denominacion,
      referencia: formState.referencia,
      logo: formState.logo,
      tipocanalcomercializacionid: Number(formState.tipocanalcomercializacionid),
      equipocomercialid: Number(formState.equipocomercialid),
      tipocontratoid: Number(formState.tipocontratoid),
      montomaximo: parseMonto(selectedChain),
      monedaid: Number(formState.monedaid),
      montomaximoutilizado: Number(desenmascarar(formState.montomaximoutilizado)),
      porcentajemaximoutilizado: Number(desenmascarar(formState.porcentajemaximoutilizado)),
      activa: "1",
      modelodocumentoid: Number(formState.modelodocumentoid) || 0,
    };

    crearMutation.mutate(payload, {
      onSuccess: async () => {
        // Inicializar requisitos por defecto para esta nueva cadena
        try {
          const defaultConfigs = {
            fisica: DEFAULT_PHYSICAL_CONFIG,
            sa: DEFAULT_SA_CONFIG,
            srl: DEFAULT_SRL_CONFIG,
            sh: DEFAULT_SH_CONFIG,
            otras: DEFAULT_OTRAS_CONFIG,
          };
          await requisitosService.guardarRequisitos(payload.cadenavalorid, defaultConfigs);
        } catch (reqErr) {
          console.error("Error al inicializar requisitos por defecto para nueva cadena:", reqErr);
        }

        toast.success("Cadena de valor activada exitosamente para la web");
        setConfirmOpen(false);
        onSuccess();
        onClose();
        // Reset state
        setStep("select");
        setSelectedChain(null);
      },
      onError: (err) => {
        console.error("Error al crear cadena:", err);
        toast.error("Ocurrió un error al activar la cadena de valor", { description: mensajeNegocio(err, "") });
        setConfirmOpen(false);
      }
    });
  };

  const getLogoSrc = (logo) => {
    if (!logo) return "";
    if (logo.startsWith("data:") || logo.startsWith("http")) return logo;
    return `data:image/png;base64,${logo}`;
  };

  const enFormulario = !isLoadingTodas && step !== "select";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Activar cadena de valor"
      subtitle={enFormulario ? undefined : "Habilitá una cadena de SGR+ en la plataforma web."}
      icono={<FiPower />}
      maxWidth={enFormulario ? "780px" : "620px"}
      variant="blue"
      preventClose={crearMutation.isPending}
      footer={
        enFormulario ? (
          <>
            <span className={f.pieAyuda}>Los campos con * son obligatorios</span>
            <Button variant="adminNeutro" onClick={() => setStep("select")} disabled={crearMutation.isPending}>
              <FiArrowLeft aria-hidden="true" /> Volver
            </Button>
            <Button
              variant="blue"
              onClick={handleSave}
              isLoading={crearMutation.isPending}
              disabled={!!errorPendiente}
              title={errorPendiente}
            >
              <FiPower aria-hidden="true" /> Activar cadena
            </Button>
          </>
        ) : (
          <Button variant="adminNeutro" onClick={onClose}>
            Cancelar
          </Button>
        )
      }
    >
      <div className={f.cuerpo}>
        {isLoadingTodas ? (
          <div className={f.lista}>
            <Skeleton width="100%" height="2.5rem" radius="0.6rem" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={f.opcion}>
                <Skeleton width="2.25rem" height="2.25rem" radius="0.6rem" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="55%" height="0.9rem" />
                  <Skeleton width="35%" height="0.7rem" style={{ marginTop: "0.4rem" }} />
                </div>
              </div>
            ))}
          </div>
        ) : step === "select" ? (
          <>
            <PasosActivacion paso={1} />
            <label className={f.buscador}>
              <FiSearch aria-hidden="true" />
              <input
                type="text"
                placeholder="Buscar cadena por denominación o ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar cadena"
              />
            </label>
            <div className={f.lista}>
              {filteredInactive.map((chain) => (
                <button
                  type="button"
                  key={chain.cadenavalorid}
                  className={f.opcion}
                  onClick={() => handleSelectChain(chain)}
                >
                  <span className={f.opcionAvatar} aria-hidden="true">
                    {obtenerInicialesEmpresa(chain.denominacion || "CV")}
                  </span>
                  <span className={f.opcionTextos}>
                    <strong>{chain.denominacion}</strong>
                    <span>CUIT {chain.cuittercero || "no disponible"}</span>
                  </span>
                  <span className={f.opcionId}>ID {chain.cadenavalorid}</span>
                  <FiChevronRight className={f.opcionChevron} aria-hidden="true" />
                </button>
              ))}
              {filteredInactive.length === 0 && (
                <p className={f.vacio}>No se encontraron cadenas de valor vigentes para activar.</p>
              )}
            </div>
            <p className={f.ayuda}>Solo se listan las cadenas de SGR+ que todavía no están activas en la web.</p>
          </>
        ) : (
          <>
            <PasosActivacion paso={2} />
            <CadenaHeaderCard
              compacta
              denominacion={selectedChain?.denominacion || formState.denominacion}
              logo={formState.logo || selectedChain?.logo}
              referencia={formState.referencia || selectedChain?.referencia}
              cadenavalorid={selectedChain?.cadenavalorid || formState.cadenavalorid}
              cuittercero={selectedChain?.cuittercero}
            />

            <SeccionCadena icono={<FiHash />} titulo="Identificación">
              <div className={`${f.grilla} ${f.grilla3}`}>
                <InputSimple label="ID de Cadena" value={formState.cadenavalorid} disabled hideErrorSpace />
                <InputSimple label="Denominación" value={formState.denominacion} disabled hideErrorSpace />
                <InputSimple
                  label="Referencia"
                  value={formState.referencia}
                  onChange={(val) => setFormState({ ...formState, referencia: val })}
                  hideErrorSpace
                />
              </div>
              <CargaLogoCadena
                logoSrc={getLogoSrc(formState.logo)}
                onElegir={triggerFileSelect}
                onQuitar={() => setFormState({ ...formState, logo: "" })}
              />
            </SeccionCadena>

            <SeccionCadena icono={<FiBriefcase />} titulo="Configuración comercial">
              <div className={`${f.grilla} ${f.grilla3}`}>
                <SelectSimple
                  label="Canal Comercialización *"
                  placeholder="Seleccione canal comercial..."
                  options={canalesOpciones}
                  value={formState.tipocanalcomercializacionid}
                  onChange={(val) => handleInputChange("tipocanalcomercializacionid", val)}
                  hideErrorSpace
                />
                <SelectSimple
                  label="Equipo Comercial *"
                  placeholder="Seleccione equipo comercial..."
                  options={equiposOpciones}
                  value={formState.equipocomercialid}
                  onChange={(val) => handleInputChange("equipocomercialid", val)}
                  hideErrorSpace
                />
                <SelectSimple
                  label="Tipo de Contrato *"
                  placeholder="Seleccione tipo de contrato..."
                  options={contratosOpciones}
                  value={formState.tipocontratoid}
                  onChange={(val) => handleInputChange("tipocontratoid", val)}
                  hideErrorSpace
                />
              </div>
            </SeccionCadena>

            <SeccionCadena icono={<FiFileText />} titulo="Modelo de documento">
              <div className={`${f.grilla} ${f.grilla2}`}>
                <SelectSimple
                  label="Tipo de Modelo"
                  placeholder="Seleccione tipo de modelo..."
                  options={tiposModeloDocumentoOpciones}
                  value={tipoModeloDocumentoIdUI}
                  onChange={handleTipoModeloDocumentoChange}
                  hideErrorSpace
                />
                <div className={f.campo}>
                  <SelectSimple
                    label="Modelo de Documento"
                    placeholder={
                      cargandoModelosDocumento
                        ? "Cargando..."
                        : tipoModeloDocumentoIdUI && modelosDocumentoOpciones.length === 0
                          ? "Sin modelos disponibles"
                          : "Seleccione modelo..."
                    }
                    options={modelosDocumentoOpciones}
                    value={formState.modelodocumentoid !== "0" ? formState.modelodocumentoid : ""}
                    onChange={(val) => handleInputChange("modelodocumentoid", val)}
                    disabled={!tipoModeloDocumentoIdUI || modelosDocumentoOpciones.length === 0}
                    hideErrorSpace
                  />
                  {!cargandoModelosDocumento && modelosDocumentoOcultos > 0 && (
                    <span className={f.ayuda}>
                      {modelosDocumentoOpciones.length === 0
                        ? "Ningún modelo de este tipo se puede generar desde una solicitud."
                        : `Se ocultaron ${modelosDocumentoOcultos} modelo(s) que no se pueden generar desde una solicitud.`}
                    </span>
                  )}
                </div>
              </div>
            </SeccionCadena>

            <SeccionCadena icono={<FiDollarSign />} titulo="Límites financieros">
              <div className={`${f.grilla} ${f.grilla3}`}>
                <SelectSimple
                  label="Moneda *"
                  placeholder="Seleccione moneda..."
                  options={monedasOpciones}
                  value={formState.monedaid}
                  onChange={(val) => handleInputChange("monedaid", val)}
                  hideErrorSpace
                />
                <div className={f.campo}>
                  <InputSimple
                    label="Monto Máximo Utilizado *"
                    value={formState.montomaximoutilizado}
                    onChange={(val) => handleInputChange("montomaximoutilizado", val)}
                    mask="$ num"
                    blocks={{ num: bloqueNumerico() }}
                    lazy={false}
                    sinIconos
                    disabled={!formState.monedaid}
                  />
                  {!formState.monedaid && <span className={f.ayudaEnCampo}>Elegí primero una moneda</span>}
                  {formState.monedaid && (
                    <MontoEnPalabras value={desenmascarar(formState.montomaximoutilizado)} />
                  )}
                </div>
                <InputSimple
                  label="Porcentaje Máximo Utilizado (%) *"
                  value={formState.porcentajemaximoutilizado}
                  onChange={(val) => handleInputChange("porcentajemaximoutilizado", val)}
                  mask="% num"
                  blocks={{ num: bloqueNumerico(100) }}
                  lazy={false}
                  hideErrorSpace
                />
              </div>
            </SeccionCadena>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept={FORMATOS_ARCHIVO.imagen.accept}
              onChange={handleFileChange}
            />
          </>
        )}
      </div>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSave}
        titulo="Confirmar activación"
        mensaje="¿Estás seguro de que deseas activar esta cadena de valor en la plataforma web?"
        variant="blue"
        confirmText="Activar"
        cancelText="Cancelar"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={crearMutation.isPending}
      />
    </Modal>
  );
};
