import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FiCheckCircle, FiEdit } from "react-icons/fi";
import { InputFlotante, Button, Acordeon, CargaArchivos, Alert } from "../../../ui";
import styles from "./Paso5Documentacion.module.css";

export default function Paso5Documentacion({
  docExpandido,
  toggleDoc,
  socios,
  onVolverASocios,
  faseApoderado,
  setFaseApoderado,
  apoNombre,
  apoRol,
  setApoRol,
  validarCuitApoderado,
  guardarApoderado,
  avanzarPaso6,
}) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const apoCuitIngresado = watch("apoCuit", "");
  const [editModes, setEditModes] = useState({});

  const handleEditSocio = (e, socioId) => {
    e.stopPropagation();
    setEditModes((prev) => ({ ...prev, [socioId]: true }));
    if (docExpandido !== socioId) {
      toggleDoc(socioId);
    }
  };

  const handleGuardarDatosSocio = (socioId) => {
    setEditModes((prev) => ({ ...prev, [socioId]: false }));
  };

  return (
    <div className={styles.container}>
      {/* SECCIÓN 1: DOCUMENTACIÓN EMPRESA */}
      <h3 className={styles.title}>Documentación requerida</h3>

      <Acordeon title="Estatuto" status="check" defaultOpen={true}>
        <CargaArchivos title="Subir archivo" subtitle="PDF o ZIP menor a 5MB" />
        <div className={styles.docInfoBox}>
          Los estatutos son las normas por las que se regirá el funcionamiento
          de la entidad.
        </div>
      </Acordeon>

      <Acordeon title="Último Balance exigible, certificado" status="alert">
        <CargaArchivos title="Subir archivo" subtitle="PDF o ZIP menor a 5MB" />
        <div className={styles.docInfoBox}>
          Este informe debe ser auditado por un contador.
        </div>
      </Acordeon>

      {/* REINCORPORADOS: Acta y Poderes */}
      <Acordeon title="Acta de designación de autoridades" status="alert">
        <CargaArchivos title="Subir archivo" subtitle="PDF o ZIP menor a 5MB" />
        <div className={styles.docInfoBox}>
          Copia certificada del acta de asamblea donde se designan las autoridades vigentes.
        </div>
      </Acordeon>

      <Acordeon title="Poderes" status="warn">
        <CargaArchivos title="Subir archivo" subtitle="PDF o ZIP menor a 5MB" />
        <div className={styles.docInfoBox}>
          Copia de los poderes otorgados para operar y representar a la sociedad.
        </div>
      </Acordeon>

      <hr className={styles.divider} />

      {/* SECCIÓN 2: DOCUMENTACIÓN SOCIOS */}
      <h3 className={`${styles.title} ${styles.titleSmallMargin}`}>
        Completá la información y documentación de cada socio.
      </h3>
      
      {socios.length === 0 ? (
        <Alert variant="warning" layout="box">
          No hay socios cargados para completar información.
        </Alert>
      ) : (
        socios.map((socio, index) => {
          const socioId = `socio-${index}`;
          const isEditing = editModes[socioId];
          
          const sEmail = watch(`socios.${index}.email`) || "";
          const sCel = watch(`socios.${index}.celular`) || "";
          const sDir = watch(`socios.${index}.direccion`) || "";
          const sProv = watch(`socios.${index}.provincia`) || "";
          const sLoc = watch(`socios.${index}.localidad`) || "";

          return (
            <Acordeon key={index} title={`CUIT ${socio.cuit}`} status="alert">
              <div>
                <div className={styles.editButtonWrapper}>
                  <Button
                    variant="outline"
                    className={styles.ghostButtonSmall}
                    onClick={(e) => handleEditSocio(e, socioId)}
                  >
                    <FiEdit className={styles.iconMarginRight} /> Editar datos
                  </Button>
                </div>

                {isEditing ? (
                  <div className={styles.container}>
                    <div className={styles.row} style={{ marginTop: "30px" }}>
                      <div className={styles.col}>
                        <InputFlotante
                          label="Email"
                          type="email"
                          esValido={sEmail.includes("@")}
                          {...register(`socios.${index}.email`)}
                        />
                      </div>
                      <div className={styles.col}>
                        <InputFlotante
                          label="Celular"
                          esValido={sCel.length >= 10}
                          {...register(`socios.${index}.celular`)}
                        />
                      </div>
                    </div>

                    <div className={styles.row} style={{ marginTop: "40px" }}>
                      <div className={styles.col}>
                        <InputFlotante
                          label="Dirección"
                          esValido={sDir.length > 5}
                          {...register(`socios.${index}.direccion`)}
                        />
                      </div>
                    </div>

                    <div className={styles.row} style={{ marginTop: "40px" }}>
                      <div className={styles.col}>
                        <InputFlotante label="Provincia" esValido={sProv.length > 2} {...register(`socios.${index}.provincia`)} />
                      </div>
                      <div className={styles.col}>
                        <InputFlotante label="Localidad" esValido={sLoc.length > 2} {...register(`socios.${index}.localidad`)} />
                      </div>
                    </div>

                    <div className={styles.actionsRight} style={{ marginTop: "20px" }}>
                      <Button variant="primary" onClick={() => handleGuardarDatosSocio(socioId)}>
                        GUARDAR DATOS
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.container}>
                    <p className={styles.participationText}>
                      Participación: <strong className={styles.textYellow}>{socio.participacion}%</strong>
                    </p>
                    <div className={styles.dropzoneGrid}>
                      <CargaArchivos title="DNI Frente" subtitle="Imagen clara" />
                      <CargaArchivos title="DNI Dorso" subtitle="Imagen clara" />
                    </div>
                  </div>
                )}
              </div>
            </Acordeon>
          );
        })
      )}

      <hr className={styles.divider} />

      {/* SECCIÓN 3: Representante Legal */}
      <h3 className={styles.title}>Representante Legal / Apoderado</h3>

      {faseApoderado === "ingresar" && (
        <div className={styles.searchContainer} style={{ alignItems: "flex-start", marginTop: "20px" }}>
          <div className={styles.col}>
            <InputFlotante
              label="CUIT del apoderado"
              maxLength={11}
              esValido={apoCuitIngresado.length === 11}
              error={errors.apoCuit?.message}
              {...register("apoCuit")}
            />
          </div>
          <div style={{ marginTop: "4px" }}>
            <Button variant="primary" className={styles.tallButton} onClick={validarCuitApoderado}>
              VALIDAR
            </Button>
          </div>
        </div>
      )}

      {faseApoderado === "completar" && (
        <div className={styles.container}>
          <div className={styles.row} style={{ marginTop: "30px" }}>
            <div className={styles.col}>
              <InputFlotante label="Cuit" value={apoCuitIngresado} readOnly disabled esValido={true} />
            </div>
            <div className={styles.col}>
              <InputFlotante label="Nombre y Apellido" value={apoNombre} readOnly disabled esValido={true} />
            </div>
          </div>
          <div className={styles.row} style={{ marginTop: "40px" }}>
            <div className={styles.col}>
              <InputFlotante label="Email" type="email" esValido={watch("apoEmail")?.includes("@")} {...register("apoEmail")} />
            </div>
            <div className={styles.col}>
              <InputFlotante label="Celular" esValido={watch("apoCelular")?.length >= 10} {...register("apoCelular")} />
            </div>
          </div>
          <div className={styles.actionsFlex} style={{ marginTop: "20px" }}>
            <Button variant="outline" className={styles.borderless} onClick={() => setFaseApoderado("ingresar")}>CANCELAR</Button>
            <Button variant="primary" onClick={guardarApoderado}>GUARDAR</Button>
          </div>
        </div>
      )}

      {faseApoderado === "guardado" && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryInfo}>
            <div className={styles.summaryStatus}><FiCheckCircle size={16} /><span>IDENTIDAD VALIDADA</span></div>
            <p className={styles.summaryName}>{apoNombre} - {apoRol}</p>
          </div>
          <Button variant="outline" onClick={() => setFaseApoderado("completar")}><FiEdit /> Editar</Button>
        </div>
      )}

      <hr className={styles.divider} />

      {/* SECCIÓN 4: Facturación */}
      <div className={styles.billingSection}>
        <h3 className={styles.titleSmall}>MAIL DE FACTURACIÓN:</h3>
        <div className={styles.billingInputWrapper} style={{ marginTop: "40px" }}>
          <InputFlotante
            label="Email"
            type="email"
            esValido={watch("emailFacturacion")?.includes("@")}
            {...register("emailFacturacion")}
          />
        </div>
      </div>

      <div className={styles.actionsRight}>
        <Button variant="primary" onClick={avanzarPaso6}>CONTINUAR</Button>
      </div>
    </div>
  );
}