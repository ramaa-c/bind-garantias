import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiSearch, FiPlus, FiChevronDown, FiX, FiEdit, FiImage, FiList, FiUser, FiUsers } from "react-icons/fi";
import { toast } from "sonner";
import styles from "./AdminCadenasValor.module.css";

const MOCK_DATA = [
  { id: 1, razonSocial: "Indigo", cuit: "30715623559", url: "sgr-indigo.pcnt.io", email: "infoargentina@mailinator.com", codigoExterno: "932034", canalComercial: "Cadena de valor", equipoComercial: "Web", maxValue: "0", maxPercent: "", requiredDocs: "DNI Frente (Socio) , DNI Dor...", contractType: "Contrato sin fianza", isActiva: false, sendEmail: false },
  { id: 2, razonSocial: "Syngenta", cuit: "30646328450", url: "sgr-syngenta.pcnt.io", email: "info@mailinator.com", codigoExterno: "", canalComercial: "", equipoComercial: "", maxValue: "0", maxPercent: "", requiredDocs: "", contractType: "", isActiva: false, sendEmail: false },
  { id: 3, razonSocial: "Bind Garantías", cuit: "30708609915", url: "sgr-mcv2-dev.onscore.io", email: "probandomeilnuevamente@yopmail.com", codigoExterno: "", canalComercial: "", equipoComercial: "", maxValue: "0", maxPercent: "", requiredDocs: "", contractType: "", isActiva: false, sendEmail: false },
  { id: 4, razonSocial: "John Deere", cuit: "30503720236", url: "sgr-mcv1-dev.onscore.io", email: "probandomeil@mail.com", codigoExterno: "", canalComercial: "", equipoComercial: "", maxValue: "0", maxPercent: "", requiredDocs: "", contractType: "", isActiva: false, sendEmail: false },
  { id: 5, razonSocial: "Grupo Bind S.A.", cuit: "30715649299", url: "sgr-mcv14.pcnt.io", email: "garantiassgr@bindgarantias.com.ar", codigoExterno: "", canalComercial: "", equipoComercial: "", maxValue: "0", maxPercent: "", requiredDocs: "", contractType: "", isActiva: false, sendEmail: false },
  { id: 6, razonSocial: "La Gran Empresa", cuit: "30526712729", url: "sgr-mcv3-dev.onscore.io", email: "Lagranempresa@mailinator.com", codigoExterno: "", canalComercial: "", equipoComercial: "", maxValue: "0", maxPercent: "", requiredDocs: "", contractType: "", isActiva: false, sendEmail: false }
];

export default function AdminCadenasValor() {
  const [cadenas, setCadenas] = useState(MOCK_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [modalType, setModalType] = useState(null); // "edit", "cdas", "logo", "users", "sociedades"
  const [activeItem, setActiveItem] = useState(null);

  const toggleDropdown = (id) => {
    setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  const handleActionClick = (item, type) => {
    setActiveItem({ ...item });
    setEditingItem({ ...item }); // Keep it for the edit modal backwards compatibility
    setModalType(type);
    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleSaveModal = () => {
    if (modalType === "edit") {
      setCadenas(prev => prev.map(c => c.id === editingItem.id ? editingItem : c));
      toast.success("Cadena de valor modificada exitosamente");
    } else {
      toast.success("Cambios guardados exitosamente");
    }
    setIsModalOpen(false);
  };

  const filteredCadenas = cadenas.filter(c => 
    c.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cuit.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>Administración Cadenas de Valor</h1>
          <p>Gestioná y modificá los datos de las cadenas de valor integradas</p>
        </div>
        <div className={styles.actionsTop}>
          <button className={styles.btnNuevo} onClick={() => toast.info("Crear nueva cadena (Próximamente)")}>
            <FiPlus /> NUEVO
          </button>
        </div>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.iconSearch} />
          <input 
            type="text" 
            placeholder="Filtrar por Razón Social, CUIT o Email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Razón Social</th>
                <th>Cuit</th>
                <th>Url</th>
                <th>Email de contacto</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCadenas.map(item => (
                <tr key={item.id}>
                  <td>{item.razonSocial}</td>
                  <td>{item.cuit}</td>
                  <td>{item.url}</td>
                  <td>{item.email}</td>
                  <td className={styles.actionCell}>
                    <button 
                      className={`${styles.btnActionToggle} ${activeDropdownId === item.id ? styles.active : ""}`}
                      onClick={() => toggleDropdown(item.id)}
                    >
                      <FiChevronDown />
                    </button>
                    {activeDropdownId === item.id && (
                      <div className={styles.dropdownMenu}>
                        <button className={styles.dropdownItem} onClick={() => handleActionClick(item, "edit")}>
                          <FiEdit className={styles.iconEdit} /> Editar
                        </button>
                        <button className={styles.dropdownItem} onClick={() => handleActionClick(item, "logo")}>
                          <FiImage className={styles.iconImage} /> Logo
                        </button>
                        <button className={styles.dropdownItem} onClick={() => handleActionClick(item, "cdas")}>
                          <FiList className={styles.iconList} /> CDAs
                        </button>
                        <button className={styles.dropdownItem} onClick={() => handleActionClick(item, "users")}>
                          <FiUser className={styles.iconUser} /> Usuarios relacionados
                        </button>
                        <button className={styles.dropdownItem} onClick={() => handleActionClick(item, "sociedades")}>
                          <FiUsers className={styles.iconUsers} /> Sociedades de bolsa
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && activeItem && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>
                {modalType === "edit" && "MODIFICAR"}
                {modalType === "logo" && `Logo de ${activeItem.razonSocial}`}
                {modalType === "cdas" && `CDAs habilitados para ${activeItem.razonSocial}`}
                {modalType === "users" && `Usuarios públicos habilitados para ${activeItem.razonSocial}`}
                {modalType === "sociedades" && `Sociedades de bolsa para ${activeItem.razonSocial}`}
              </h3>
              <button className={styles.closeModal} onClick={() => setIsModalOpen(false)}>
                <FiX size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {modalType === "edit" && editingItem && (
                <>
                  <div className={styles.formGroup}>
                    <label>Razón social *</label>
                    <input 
                      type="text" 
                      value={editingItem.razonSocial} 
                      onChange={e => setEditingItem({...editingItem, razonSocial: e.target.value})} 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Cuit *</label>
                    <input 
                      type="text" 
                      value={editingItem.cuit} 
                      onChange={e => setEditingItem({...editingItem, cuit: e.target.value})} 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Url *</label>
                    <input 
                      type="text" 
                      value={editingItem.url} 
                      onChange={e => setEditingItem({...editingItem, url: e.target.value})} 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email de contacto *</label>
                    <input 
                      type="text" 
                      value={editingItem.email} 
                      onChange={e => setEditingItem({...editingItem, email: e.target.value})} 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Código externo *</label>
                    <input 
                      type="text" 
                      value={editingItem.codigoExterno} 
                      onChange={e => setEditingItem({...editingItem, codigoExterno: e.target.value})} 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Canal comercial *</label>
                    <select 
                      value={editingItem.canalComercial}
                      onChange={e => setEditingItem({...editingItem, canalComercial: e.target.value})}
                    >
                      <option value="Cadena de valor">Cadena de valor</option>
                      <option value="Directo">Directo</option>
                      <option value="Broker">Broker</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Equipo comercial *</label>
                    <select
                      value={editingItem.equipoComercial}
                      onChange={e => setEditingItem({...editingItem, equipoComercial: e.target.value})}
                    >
                      <option value="Web">Web</option>
                      <option value="Presencial">Presencial</option>
                    </select>
                  </div>
                  
                  <div className={styles.checkboxGroup}>
                    <input type="checkbox" id="notaInstr" />
                    <label htmlFor="notaInstr">Nota de instrucción requerida</label>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Máximo valor utilizado permiti...</label>
                    <input 
                      type="number" 
                      value={editingItem.maxValue} 
                      onChange={e => setEditingItem({...editingItem, maxValue: e.target.value})}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Máximo porcentaje utilizado pe...</label>
                    <input 
                      type="number" 
                      value={editingItem.maxPercent} 
                      onChange={e => setEditingItem({...editingItem, maxPercent: e.target.value})}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Documentos requeridos</label>
                    <select
                      value={editingItem.requiredDocs}
                      onChange={e => setEditingItem({...editingItem, requiredDocs: e.target.value})}
                    >
                      <option value="">Seleccione...</option>
                      <option value="DNI Frente (Socio) , DNI Dor...">DNI Frente (Socio) , DNI Dor...</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tipo de contrato</label>
                    <select
                      value={editingItem.contractType}
                      onChange={e => setEditingItem({...editingItem, contractType: e.target.value})}
                    >
                      <option value="">Seleccione...</option>
                      <option value="Contrato sin fianza">Contrato sin fianza</option>
                      <option value="Contrato con fianza">Contrato con fianza</option>
                    </select>
                  </div>

                  <div className={styles.checkboxGroup}>
                    <input 
                      type="checkbox" 
                      id="activaCheck" 
                      checked={editingItem.isActiva}
                      onChange={e => setEditingItem({...editingItem, isActiva: e.target.checked})}
                    />
                    <label htmlFor="activaCheck">Activa</label>
                  </div>

                  <div className={styles.checkboxGroup}>
                    <input 
                      type="checkbox" 
                      id="emailCheck" 
                      checked={editingItem.sendEmail}
                      onChange={e => setEditingItem({...editingItem, sendEmail: e.target.checked})}
                    />
                    <label htmlFor="emailCheck">Enviar email de inicio de flujo</label>
                  </div>
                </>
              )}

              {modalType === "logo" && (
                <div>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Banco_Patagonia_logo.svg" alt="Preview Logo" className={styles.modalImagePreview} />
                  <p className={styles.modalSubtitle}>
                    Para su correcta visualización se recomienda que la imagen tenga fondo transparente y mantenga una proporción similar a 815 x 269 píxeles. El tamaño máximo permitido para la imagen es de 500kb.
                  </p>
                  <div className={styles.uploadZone}>
                    <div className={styles.uploadIcon}>⬆️</div>
                    <div>Arrastre aquí la imagen</div>
                  </div>
                </div>
              )}

              {modalType === "cdas" && (
                <div>
                  <div className={styles.cdasSection}>
                    <div className={styles.cdasTitle}>Cheque propio</div>
                    <div className={styles.cdaItem}>SIN CDAS CONFIGURADOS</div>
                  </div>
                  <div className={styles.cdasSection}>
                    <div className={styles.cdasTitle}>Alta de línea</div>
                    <div className={styles.cdaItem}>
                      <span>Actividades Excluidas</span>
                      <div className={styles.cdaActions}><button><FiX /></button></div>
                    </div>
                    <div className={styles.cdaItem}>
                      <span>Valida al socio que no sea socio protector de otra SGR</span>
                      <div className={styles.cdaActions}><button><FiX /></button></div>
                    </div>
                    <div className={styles.cdaItem}>
                      <span>Evaluar si la persona posee deudas</span>
                      <div className={styles.cdaActions}>
                        <button><FiEdit /></button>
                        <button><FiX /></button>
                        <button><FiChevronDown /></button>
                      </div>
                    </div>
                    <div className={styles.cdaItem}>
                      <span>Evaluar si la persona supera el score de Nosis</span>
                      <div className={styles.cdaActions}>
                        <button><FiEdit /></button>
                        <button><FiX /></button>
                        <button><FiChevronDown /></button>
                      </div>
                    </div>
                    <div className={styles.cdaItem}>
                      <span>Validar si un cuit se encuentra activo</span>
                      <div className={styles.cdaActions}><button><FiX /></button></div>
                    </div>
                    <div className={styles.cdaItem}>
                      <span>Validar que el certificado PyME se encuentre vigente</span>
                      <div className={styles.cdaActions}><button><FiX /></button></div>
                    </div>
                  </div>
                  <div style={{ textAlign: "center", marginTop: "1rem" }}>
                    <button className={styles.btnNuevoBlue} style={{ alignSelf: "center", marginBottom: 0 }}>NUEVO</button>
                  </div>
                </div>
              )}

              {(modalType === "users" || modalType === "sociedades") && (
                <div>
                  <button className={styles.btnNuevoBlue}>NUEVO</button>
                  <table className={styles.usersTable}>
                    <thead>
                      <tr>
                        <th>Nombre de usuario</th>
                        <th>Habilitado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>consultante_indigo1@mailinator.com</td>
                        <td>Si</td>
                        <td className={styles.cdaActions}>
                          <button><FiEdit /></button>
                          <button><FiX /></button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

            </div>
            
            <div className={styles.modalFoot}>
              {modalType === "edit" ? (
                <>
                  <button className={styles.btnCancel} onClick={() => setIsModalOpen(false)}>CANCELAR</button>
                  <button className={styles.btnSave} onClick={handleSaveModal}>ACEPTAR</button>
                </>
              ) : (
                <button className={styles.btnCancel} onClick={() => setIsModalOpen(false)}>CERRAR</button>
              )}
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
