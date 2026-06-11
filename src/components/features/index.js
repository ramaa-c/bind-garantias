// --- COMPARTIDOS ---
export * from "./admin/CdaPanel/CdaPanel";
export { default as Paso1Cuit } from './shared/Paso1Cuit/Paso1Cuit';
export { default as Paso2Datos } from './shared/Paso2Datos/Paso2Datos';
export { default as Paso3Simulador } from './shared/Paso3Simulador/Paso3Simulador';
export { default as Paso4Socios } from './shared/Paso4Socios/Paso4Socios';
export { default as Paso5Documentacion } from './shared/Paso5Documentacion/Paso5Documentacion';
export { default as Paso7Exito } from './shared/Paso7Exito/Paso7Exito';
export * from './shared/SocioItem/SocioItem';
export * from './shared/PanelDudas/PanelDudas';
export * from './shared/PanelDudas/BotonAyudaFlotante';
export * from './shared/PanelDudas/ModalDudas';
export { default as SocioModal } from './shared/SocioModal/SocioModal';
export * from './shared/DocumentosEmpresaModal/DocumentosEmpresaModal';
export * from './shared/RepresentanteModal/RepresentanteModal';
export * from './shared/SocioTaskCard/SocioTaskCard';
export { default as UbicacionModal } from "./shared/UbicacionModal/UbicacionModal";
export { default as ContactoModal } from "./shared/ContactoModal/ContactoModal";
export { default as ConfirmacionBorradorModal } from "./shared/ConfirmacionBorradorModal/ConfirmacionBorradorModal";
export * from "./shared/HistorialEstadoModal/HistorialEstadoModal";
export * from "./shared/DocumentosLegajo/DocumentosLegajo";
export * from "./shared/SociosLegajo/SociosLegajo";

// --- CHEQUES ---
export { default as Paso6Bolsa } from './cheques/Paso6Bolsa/Paso6Bolsa';

// --- SOLICITUD CHEQUES (INGRESO DE CHEQUES) ---
export { default as PasoEmisor } from './cheques/Solicitud/PasoEmisor/PasoEmisor';
export { default as PasoBolsa } from './cheques/Solicitud/PasoBolsa/PasoBolsa';
export { default as PasoDetalles } from './cheques/Solicitud/PasoDetalles/PasoDetalles';
export { default as PasoExito } from './cheques/Solicitud/PasoExito/PasoExito';

// --- CARGA MASIVA CHEQUES ---
export * from './cheques/CargaMasiva/Paso1CargaMasiva/Paso1CargaMasiva';
export * from './cheques/CargaMasiva/Paso2RevisionCheques/Paso2RevisionCheques';
export * from './cheques/CargaMasiva/Paso3Confirmacion/Paso3Confirmacion';
export * from './cheques/CargaMasiva/Paso4ExitoEpyme/Paso4ExitoEpyme';

// --- PAGARE ---
export { default as Paso1SimuladorPagare } from './pagares/Paso1SimuladorPagare/Paso1SimuladorPagare';
export { default as Paso2AgentePagare } from './pagares/Paso2AgentePagare/Paso2AgentePagare';
export { default as Paso3Epyme } from './pagares/Paso3Epyme/Paso3Epyme';
export { default as Paso4ExitoPagare } from './pagares/Paso4ExitoPagare/Paso4ExitoPagare';

// --- SOCIOS ---
export * from './socios/Gestion/Gestion';
export * from './socios/Tabla/Tabla';
export { Formulario as FormularioSocios } from './socios/Formulario/Formulario';
export { SeccionDatos as SeccionDatosSocios } from './socios/SeccionDatos/SeccionDatos';
export * from './socios/SeccionClasificacion/SeccionClasificacion';

// --- TERCEROS ---
export * from './terceros/Buscador/Buscador';
export { Formulario as FormularioTerceros } from './terceros/Formulario/Formulario';
export { SeccionDatos as SeccionDatosTerceros } from './terceros/SeccionDatos/SeccionDatos';
export * from './terceros/GestorRelaciones/GestorRelaciones';
export * from './terceros/FormularioVincular/FormularioVincular';

// --- OTROS ---
export * from './dashboard/ListaActividades/ListaActividades';
export * from './dashboard/TarjetaLinea/TarjetaLinea';
export * from './solicitudes/TarjetaSolicitud/TarjetaSolicitud';
export * from './solicitudes/DetalleSolicitudModal/DetalleSolicitudModal';

// --- ADMIN ---
export * from "./admin/ActivarCadenaModal/ActivarCadenaModal";
export * from "./admin/EditarCadenaModal/EditarCadenaModal";
export * from "./admin/CdaConfigModal/CdaConfigModal";
export * from "./admin/UsuariosRelacionadosModal/UsuariosRelacionadosModal";

