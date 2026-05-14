import React from "react";
import { Acordeon } from "../../../../ui";
import styles from "./ContenidoDudas.module.css";

export const ContenidoDudas = ({ contexto = "cheques", pasoActual = 1 }) => {
  // --- MOCK DATA DE PREGUNTAS ---
  const faqPagare = [
    {
      p: "¿Qué moneda seleccionar?",
      r: "Por el momento, la operatoria está habilitada en la moneda especificada en los términos y condiciones de tu cuenta.",
    },
    {
      p: "¿Cuál es el monto máximo de la operación?",
      r: "El monto máximo depende de tu límite crediticio aprobado actual. Podés revisarlo en la pantalla de Inicio.",
    },
    {
      p: "¿Cómo genero mi ID en ePyme?",
      r: "Debes ingresar al portal de ePyme con tu CUIT y clave fiscal, y dirigirte a la sección de vinculación de cuentas.",
    },
    {
      p: "¿La tasa que muestra el simulador es la tasa real?",
      r: "Es una tasa de referencia calculada al día de la fecha. La tasa final se fijará al momento de liquidar la operación.",
    },
  ];

  const faqSocios = [
    {
      p: "¿Por qué debo declarar a mis socios?",
      r: "Por normativas de la UIF, es obligatorio identificar a los beneficiarios finales de la sociedad.",
    },
    {
      p: "¿Qué pasa si un socio es extranjero?",
      r: "En caso de socios extranjeros, se requerirá documentación adicional respaldatoria apostillada.",
    },
  ];

  const faqIniciales = [
    {
      p: "¿Qué es el CUIT?",
      r: "El CUIT (Clave Única de Identificación Tributaria) es el código con el que AFIP identifica a trabajadores autónomos, comercios y empresas.",
    },
    {
      p: "¿Cómo verifico mi CUIT?",
      r: "Podés consultarlo ingresando a la página oficial de AFIP con tu número de DNI.",
    },
  ];

  let preguntasActuales = [];

  if (contexto === "pagare") {
    preguntasActuales = faqPagare;
  } else {
    const mostrarSocios = pasoActual === 4 || pasoActual === 5;
    preguntasActuales = mostrarSocios ? faqSocios : faqIniciales;
  }

  return (
    <div className={styles.contenidoDudas}>
      <div className={styles.faqList}>
        {preguntasActuales.map((item) => (
          <Acordeon key={item.p} title={item.p}>
            <p className={styles.respuesta}>{item.r}</p>
          </Acordeon>
        ))}
      </div>
    </div>
  );
};
