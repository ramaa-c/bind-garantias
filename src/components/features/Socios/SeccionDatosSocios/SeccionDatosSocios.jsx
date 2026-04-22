import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FiUser, FiHash, FiCalendar, FiMail } from "react-icons/fi";
import { InputSocioMasked, SelectFecha } from "../../../ui";
import { CUIT_REGEX, EMAIL_REGEX } from "../../../../utils/validators";
import styles from "./SeccionDatosSocios.module.css";

export const SeccionDatosSocios = () => {
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
    <div>
      <h3 className={styles.sectionTitle}>Datos Identificatorios</h3>
      <div className={styles.inputRow}>
        <InputSocioMasked
          name="razonsocial"
          control={control}
          rules={{ required: "Campo obligatorio" }}
          label="Razón Social / Nombre"
          icon={<FiUser />}
          esValido={razon?.length > 2 && !errors.razonsocial}
          error={errors.razonsocial?.message}
        />

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

        <SelectFecha
          name="fechaconstitucion"
          control={control}
          label="Fecha Constitución"
          icon={<FiCalendar />}
          error={errors.fechaconstitucion?.message}
        />

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
