import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FiUser, FiHash, FiMail, FiPhone, FiTag } from "react-icons/fi";
import { InputSocioMasked, SelectSocio } from "../../../ui";
import { useTipoPersona } from "../../../../hooks/useCatalogos";

const CUIT_REGEX = /^\d{11}$/;
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const SeccionDatosTercero = () => {
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h3
        style={{
          color: "var(--white)",
          borderBottom: "1px solid #333",
          paddingBottom: "0.5rem",
          margin: 0,
        }}
      >
        Datos del Tercero Relacionado
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
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
      </div>
    </div>
  );
};
