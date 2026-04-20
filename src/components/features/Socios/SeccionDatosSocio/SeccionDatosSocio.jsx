import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FiUser, FiHash, FiCalendar, FiMail } from "react-icons/fi";
import { InputSocioMasked, SelectFecha } from "../../../ui";

const CUIT_REGEX = /^\d{11}$/;
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const SeccionDatosSocio = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const [razon, cuit, email] = useWatch({
    control,
    name: ["razonsocial", "cuit", "email"],
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
        Datos Identificatorios
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Razón Social */}
        <InputSocioMasked
          name="razonsocial"
          control={control}
          rules={{ required: "Campo obligatorio" }}
          label="Razón Social / Nombre"
          icon={<FiUser />}
          esValido={razon?.length > 2 && !errors.razonsocial}
          error={errors.razonsocial?.message}
        />

        {/* CUIT */}
        <InputSocioMasked
          name="cuit"
          control={control}
          rules={{
            required: "Campo obligatorio",
            pattern: { value: CUIT_REGEX, message: "Deben ser 11 números" },
          }}
          label="CUIT (11 dígitos)"
          type="number"
          icon={<FiHash />}
          esValido={CUIT_REGEX.test(cuit) && !errors.cuit}
          error={errors.cuit?.message}
        />

        {/* Fecha Constitución */}
        <SelectFecha
          name="fechaconstitucion"
          control={control}
          label="Fecha Constitución"
          icon={<FiCalendar />}
          error={errors.fechaconstitucion?.message}
        />

        {/* Email */}
        <InputSocioMasked
          name="email"
          control={control}
          rules={{
            required: "Campo obligatorio",
            pattern: { value: EMAIL_REGEX, message: "Email inválido" },
          }}
          label="Email Principal"
          icon={<FiMail />}
          esValido={EMAIL_REGEX.test(email) && !errors.email}
          error={errors.email?.message}
        />
      </div>
    </div>
  );
};
