import React from "react";
import { Acordeon } from "../../../../ui";
import styles from "./ContenidoDudas.module.css";

export const ContenidoDudas = ({ contexto = "cheques", pasoActual = 1 }) => {
  // --- PREGUNTAS DEL INICIO / DASHBOARD ---
  const faqInicio = [
    {
      p: "¿Cómo hago si necesito otro producto?",
      r: "Comunicate con nosotros enviándonos un mail a probandomail@mail.com",
    },
    {
      p: "¿Tenés que ingresar una tanda de cheques?",
      r: 'Seleccioná la opción "NUEVA CARGA MASIVA" y te permitirá incluir en una sola operación la cantidad de cheques que necesites importando un archivo Excel',
    },
  ];

  // --- PREGUNTAS DEL SIMULADOR ---
  const faqSimulador = [
    {
      p: "¿Qué moneda seleccionar?",
      r: "De acuerdo a la que más se adapte a tus necesidades. Si elegís Pesos vas a poder Operar con cheques propios y si elegís Dólares podrás seleccionar Pagarés o Préstamos.",
    },
    {
      p: "¿Cuál es el monto máximo de la operación?",
      r: "El monto máximo de la operación es de $122000. El monto máximo deberá incluir Intereses comisiones gastos e impuestos.",
    },
    {
      p: "¿Cómo obtengo el monto máximo de la operación?",
      r: "Lo podrás obtener a través del Simulador.",
    },
    {
      p: "¿Qué importe es el que se aplicará a tu cuenta en John Deere?",
      r: "Es el neto estimado a recibir, el cual figura en primer lugar en el simulador.",
    },
    {
      p: "¿Cuál es el plazo máximo que puedo solicitar?",
      r: "El plazo máximo es el que se muestra preestablecido en el selector de plazo.",
    },
    {
      p: "¿La tasa que muestra el simulador es la tasa a la que se van a descontar mis cheques?",
      r: "No. La tasa se determinará en el día que se efectivice la operación en el mercado de capitales.",
    },
    {
      p: "¿Que se selecciona en Tipo de Calculo?",
      r: 'Si ya tenés el cheque, seleccioná "Por monto de Cheque", si querés calcularlo, seleccioná "Por monto de factura".',
    },
  ];

  // --- PREGUNTAS DE SOCIOS ---
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

  let preguntasActuales = [];

  if (contexto === "inicio") {
    preguntasActuales = faqInicio;
  } else {
    const mostrarSocios = pasoActual === 4 || pasoActual === 5;
    preguntasActuales = mostrarSocios ? faqSocios : faqSimulador;
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
