import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FiUser, FiHash, FiMail, FiPhone, FiTag } from "react-icons/fi";
import { InputSocioMasked, SelectSocio, FormSection } from "../../../ui";
import { useTipoPersona } from "../../../../hooks/useCatalogos";
import { CUIT_REGEX, EMAIL_REGEX } from "../../../../utils/validators";

export const SeccionDatos = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const { data: personaData, isLoading: cargandoPersona } = useTipoPersona();

  const [denominacion, cuit, email, telefono, tipoPersona] = useWatch({
    control,
    name: ["denominacion", "cuit", "mail", "telefono", "tipopersonaid"],
    defaultValue: "",
  });

  return (
    <FormSection title="Datos del Tercero Relacionado">
      <InputSocioMasked
        name="denominacion"
        control={control}
        rules={{ required: "La denominación es obligatoria" }}
        label="Denominación / Razón Social"
        icon={<FiUser />}
        esValido={denominacion?.length > 2 && !errors.denominacion}
        error={errors.denominacion?.message}
      />

      <InputSocioMasked
        name="cuit"
        control={control}
        rules={{
          required: "El CUIT es obligatorio",
          pattern: { value: CUIT_REGEX, message: "Deben ser 11 números" },
        }}
        label="CUIT (11 dígitos)"
        type="number"
        icon={<FiHash />}
        esValido={CUIT_REGEX.test(cuit) && !errors.cuit}
        error={errors.cuit?.message}
      />

      <SelectSocio
        name="tipopersonaid"
        control={control}
        label={cargandoPersona ? "Cargando..." : "Tipo de Persona"}
        icon={<FiTag />}
        options={cargandoPersona ? [] : personaData?.opciones}
        disabled={cargandoPersona}
        error={errors.tipopersonaid?.message}
        esValido={!!tipoPersona && !errors.tipopersonaid}
      />

      <InputSocioMasked
        name="mail"
        control={control}
        rules={{
          required: "El email es obligatorio",
          pattern: { value: EMAIL_REGEX, message: "Email inválido" },
        }}
        label="Correo Electrónico"
        icon={<FiMail />}
        esValido={EMAIL_REGEX.test(email) && !errors.mail}
        error={errors.mail?.message}
      />

      <InputSocioMasked
        name="telefono"
        control={control}
        rules={{ required: "El teléfono es obligatorio" }}
        label="Teléfono de Contacto"
        type="tel"
        icon={<FiPhone />}
        esValido={telefono?.length > 5 && !errors.telefono}
        error={errors.telefono?.message}
      />
    </FormSection>
  );
};
