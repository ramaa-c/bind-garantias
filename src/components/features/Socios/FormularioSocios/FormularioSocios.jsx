import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { FiSave, FiX } from "react-icons/fi";
import { Button, Alert } from "../../../ui";
import {
  SeccionDatosSocios,
  SeccionClasificacionSocios,
} from "../../../features";
import { useCrearSocio, useActualizarSocio } from "../../../../hooks/useSocios";
import styles from "./FormularioSocios.module.css";

export const FormularioSocios = ({
  socioExistente = null,
  onGuardado,
  onCancelar,
}) => {
  const esEdicion = !!socioExistente;

  const metodos = useForm({
    values: {
      razonsocial: socioExistente?.denominacion || "",
      cuit: socioExistente?.cuit || "",
      fechaconstitucion: socioExistente?.fechainicioactividades || "",
      email: socioExistente?.email || "",
      tipopersonaid: socioExistente?.tipopersonaid?.toString() || "",
      tiporegimenivaid: socioExistente?.tiporegimenivaid?.toString() || "",
      tamanioempresaid: socioExistente?.tamanioempresaid?.toString() || "",
      tipoactividadbcraid:
        socioExistente?.tipoactividadbcraid?.toString() || "",
      tipoactividadsepymeid:
        socioExistente?.tipoactividadsepymeid?.toString() || "",
    },
    mode: "onChange",
  });

  const mutacionCrear = useCrearSocio();
  const mutacionActualizar = useActualizarSocio();

  const estaGuardando = mutacionCrear.isPending || mutacionActualizar.isPending;
  const errorGuardado = mutacionCrear.error || mutacionActualizar.error;

  const onSubmit = (formData) => {
    const socioPorDefecto = {
      socioid: 0,
      entidadid: 1,
      tiposocioid: 2,
      cuit: "",
      denominacion: "",
      calle: "",
      numero: 0,
      piso: "",
      departamento: "",
      ciudadid: 0,
      telefono: "",
      fax: "",
      email: "",
      tipopersonaid: 0,
      tipocarteraid: 0,
      sectorcontableid: 0,
      tipoactividadbcraid: 0,
      tipoactividadsepymeid: 0,
      marcavinculacion: "0",
      situacionbcraid: 1,
      fechabaja: null,
      motivobajaid: 0,
      socioestadoid: 22,
      codpos: "",
      tamanioempresaid: 0,
      fechacierreejercicio: null,
      legajo: 0,
      tiporegimenivaid: 0,
      actividadespecifica: "",
      partido: "",
      telefono2: "",
      telefono3: "",
      visitado: "",
      scoringcomercial: "",
      partidoid: 0,
      fechainicioactividades: null,
      tipoactividadglobalid: 0,
      tipocanalcomercializacionid: 0,
      emailfacturacion: "",
      minapoderadosrequeridos: 0,
      tipocondicionfianzaid: 0,
      jsoncondicionfianza: "",
    };

    const basePayload = esEdicion ? { ...socioExistente } : socioPorDefecto;

    const payload = {
      ...basePayload,
      cuit: formData.cuit,
      denominacion: formData.razonsocial,
      email: formData.email,
      fechainicioactividades: formData.fechaconstitucion
        ? formData.fechaconstitucion
        : null,
      tipopersonaid: Number(formData.tipopersonaid) || 0,
      tiporegimenivaid: Number(formData.tiporegimenivaid) || 0,
      tamanioempresaid: Number(formData.tamanioempresaid) || 0,
      tipoactividadbcraid: Number(formData.tipoactividadbcraid) || 0,
      tipoactividadsepymeid: Number(formData.tipoactividadsepymeid) || 0,
    };

    const operacion = esEdicion
      ? mutacionActualizar.mutateAsync(payload)
      : mutacionCrear.mutateAsync(payload);

    operacion
      .then(() => {
        onGuardado();
      })
      .catch((err) => {
        console.error("Fallo al guardar el socio:", err);
        if (err.response) {
          console.error("Data del servidor:", err.response.data);
          console.error("Status:", err.response.status);
          console.error("Headers:", err.response.headers);
        } else if (err.request) {
          console.error(
            "La petición se hizo pero no hubo respuesta",
            err.request,
          );
        } else {
          console.error("Error armando la petición", err.message);
        }
      });
  };

  return (
    <FormProvider {...metodos}>
      <form onSubmit={metodos.handleSubmit(onSubmit)} className={styles.form}>
        <SeccionDatosSocios />
        <SeccionClasificacionSocios />

        {errorGuardado && (
          <Alert variant="error" className={styles.errorBox}>
            Error al intentar {esEdicion ? "actualizar" : "crear"} el socio:{" "}
            {errorGuardado.message}
          </Alert>
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancelar}
            disabled={estaGuardando}
          >
            <FiX style={{ marginRight: "0.5rem" }} /> CANCELAR
          </Button>

          <Button type="submit" variant="primary" disabled={estaGuardando}>
            <FiSave style={{ marginRight: "0.5rem" }} />
            {estaGuardando
              ? esEdicion
                ? "ACTUALIZANDO..."
                : "CREANDO..."
              : esEdicion
                ? "GUARDAR CAMBIOS"
                : "CREAR SOCIO"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
