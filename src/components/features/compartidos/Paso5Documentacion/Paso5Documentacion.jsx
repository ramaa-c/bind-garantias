import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FiCheckCircle, FiEdit } from "react-icons/fi";
import { Input, Button, Acordeon, CargaArchivos, Alert } from "../../../ui";
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
          de la entidad. En ellas se contemplan temas de vital importancia.
        </div>
      </Acordeon>

      <Acordeon title="Último Balance exigible, certificado" status="alert">
        <CargaArchivos title="Subir archivo" subtitle="PDF o ZIP menor a 5MB" />
        <div className={styles.docInfoBox}>
          El estado de situación financiera se estructura a través de tres
          conceptos patrimoniales. Este informe debe ser auditado por un
          contador.
        </div>
      </Acordeon>

      <Acordeon title="Acta de designación de autoridades" status="alert">
        <CargaArchivos title="Subir archivo" subtitle="PDF o ZIP menor a 5MB" />
        <div className={styles.docInfoBox}>
          Copia certificada del acta de asamblea donde se designan las
          autoridades vigentes.
        </div>
      </Acordeon>

      <Acordeon title="Poderes" status="warn">
        <CargaArchivos title="Subir archivo" subtitle="PDF o ZIP menor a 5MB" />
        <div className={styles.docInfoBox}>
          Copia de los poderes otorgados para operar y representar a la
          sociedad.
        </div>
      </Acordeon>

      <hr className={styles.divider} />

      {/* SECCIÓN 2: DOCUMENTACIÓN SOCIOS */}

      <h3 className={`${styles.title} ${styles.titleSmallMargin}`}>
        Completá la información y documentación de cada socio.
      </h3>
      <p className={styles.mutedText}>
        La dirección de mail tiene que ser personal (no de un sector de la
        empresa).
      </p>

      {socios.length === 0 ? (
        <Alert variant="warning" layout="box">
          No hay socios cargados para completar información.
        </Alert>
      ) : (
        socios.map((socio, index) => {
          const socioId = `socio-${index}`;
          const isEditing = editModes[socioId];

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
                    <p className={styles.editingSubtitle}>
                      Editando datos de:{" "}
                      <strong className={styles.textWhite}>
                        {socio.nombre}
                      </strong>
                    </p>

                    <div className={styles.row}>
                      <div className={styles.col}>
                        <Input
                          label="Email *"
                          type="email"
                          {...register(`socios.${index}.email`)}
                        />
                      </div>
                      <div className={styles.col}>
                        <Input
                          label="Celular *"
                          type="text"
                          {...register(`socios.${index}.celular`)}
                        />
                      </div>
                    </div>

                    <div className={styles.row}>
                      <div className={styles.col}>
                        <Input
                          label="Dirección *"
                          type="text"
                          {...register(`socios.${index}.direccion`)}
                        />
                      </div>
                    </div>

                    <div className={styles.row}>
                      <div className={styles.col}>
                        <Input
                          label="Provincia *"
                          type="text"
                          {...register(`socios.${index}.provincia`)}
                        />
                      </div>
                      <div className={styles.col}>
                        <Input
                          label="Localidad *"
                          type="text"
                          {...register(`socios.${index}.localidad`)}
                        />
                      </div>
                    </div>

                    <div className={styles.actionsRight}>
                      <Button
                        variant="primary"
                        onClick={() => handleGuardarDatosSocio(socioId)}
                      >
                        GUARDAR DATOS
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.container}>
                    <p className={styles.participationText}>
                      Participación:{" "}
                      <strong className={styles.textYellow}>
                        {socio.participacion}%
                      </strong>
                      <span className={styles.mutedDetail}>
                        | {socio.nombre}
                      </span>
                    </p>

                    <div className={styles.dropzoneGrid}>
                      <CargaArchivos
                        title="DNI Frente"
                        subtitle="Imagen clara (.jpg, .png, .pdf)"
                      />
                      <CargaArchivos
                        title="DNI Dorso"
                        subtitle="Imagen clara (.jpg, .png, .pdf)"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Acordeon>
          );
        })
      )}

      <div className={styles.actionsRight}>
        <Button
          variant="outline"
          className={styles.borderless}
          onClick={onVolverASocios}
        >
          Editar lista general de socios
        </Button>
      </div>

      <hr className={styles.divider} />

      {/* SECCIÓN 3: Representante Legal / Apoderado */}

      <h3 className={styles.title}>Representante Legal / Apoderado</h3>

      {faseApoderado === "ingresar" && (
        <div className={styles.searchContainer}>
          <div className={styles.col}>
            <Input
              placeholder="Ingresar CUIT del apoderado"
              error={errors.apoCuit?.message}
              {...register("apoCuit")}
            />
          </div>
          <Button
            variant="primary"
            className={styles.tallButton}
            onClick={validarCuitApoderado}
          >
            VALIDAR
          </Button>
        </div>
      )}

      {faseApoderado === "completar" && (
        <div className={styles.container}>
          <div className={styles.row}>
            <div className={styles.col}>
              <Input label="Cuit" value={apoCuitIngresado} readOnly disabled />
            </div>
            <div className={styles.col}>
              <Input
                label="Nombre y Apellido"
                value={apoNombre}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="rol"
                value="Apoderado"
                checked={apoRol === "Apoderado"}
                onChange={(e) => setApoRol(e.target.value)}
                className={styles.radioInput}
              />
              Apoderado
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="rol"
                value="Representante Legal"
                checked={apoRol === "Representante Legal"}
                onChange={(e) => setApoRol(e.target.value)}
                className={styles.radioInput}
              />
              Representante Legal
            </label>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <Input
                label="Email *"
                type="email"
                error={errors.apoEmail?.message}
                {...register("apoEmail")}
              />
            </div>
            <div className={styles.col}>
              <Input
                label="Celular *"
                type="text"
                error={errors.apoCelular?.message}
                {...register("apoCelular")}
              />
            </div>
          </div>

          <div className={styles.actionsFlex}>
            <Button
              variant="outline"
              className={styles.borderless}
              onClick={() => setFaseApoderado("ingresar")}
            >
              CANCELAR
            </Button>
            <Button variant="primary" onClick={guardarApoderado}>
              GUARDAR
            </Button>
          </div>
        </div>
      )}

      {faseApoderado === "guardado" && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryInfo}>
            <div className={styles.summaryStatus}>
              <FiCheckCircle size={16} />
              <span>IDENTIDAD VALIDADA</span>
            </div>
            <p className={styles.summaryName}>
              {apoNombre} - {apoRol}
            </p>
            <p className={styles.summaryDetails}>CUIT: {apoCuitIngresado}</p>
          </div>

          <Button
            variant="outline"
            className={styles.ghostButtonBordered}
            onClick={() => setFaseApoderado("completar")}
          >
            <FiEdit className={styles.iconMarginRight} /> Editar
          </Button>
        </div>
      )}

      <hr className={styles.divider} />

      {/* SECCIÓN 4: Facturación */}

      <div className={styles.billingSection}>
        <h3 className={styles.titleSmall}>
          INDICANOS EL MAIL DONDE QUERES QUE TE LLEGUE LA FACTURA:
        </h3>
        <div className={styles.billingInputWrapper}>
          <Input
            type="email"
            placeholder="Ej: facturacion@empresa.com"
            error={errors.emailFacturacion?.message}
            {...register("emailFacturacion")}
          />
        </div>
      </div>

      <div className={styles.actionsRight}>
        <Button variant="primary" onClick={avanzarPaso6}>
          CONTINUAR
        </Button>
      </div>
    </div>
  );
}
