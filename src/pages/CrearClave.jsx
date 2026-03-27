import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FiEye, FiEyeOff, FiCheckCircle, FiCircle, FiShield } from "react-icons/fi"; 
import "../styles/login.css";
import logoBind from "../assets/images/bind-g-logo.svg";

const CheckIcon = ({ valid }) => {
  return valid ? (
    <FiCheckCircle size={16} color="var(--yellow)" className="req-icon" />
  ) : (
    <FiCircle size={16} color="#555" className="req-icon" />
  );
};

// --- ESQUEMA ZOD ---
const getClaveSchema = (emailUsuario) => {
  const emailPrefix = emailUsuario.split('@')[0].toLowerCase();

  return z.object({
    password: z.string()
      .min(12, { message: "Mínimo 12 caracteres" })
      .regex(/[a-z]/, { message: "Falta una minúscula" })
      .regex(/[A-Z]/, { message: "Falta una mayúscula" })
      .regex(/[0-9]/, { message: "Falta un número" })
      .regex(/[!_.*@#$%^&()\-+]/, { message: "Falta un caracter especial" })
      .refine(
        (val) => val.length > 0 && !val.toLowerCase().includes(emailPrefix) && val !== emailUsuario,
        { message: "La contraseña es muy similar al email" }
      ),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"], 
  });
};

const CrearClave = () => {
  const location = useLocation();
  const emailUsuario = location.state?.emailIngresado || "ejemplo@mailinator.com";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(getClaveSchema(emailUsuario)),
    mode: "onChange", 
  });

  const currentPassword = watch("password", "");

  const reqs = {
    lower: /[a-z]/.test(currentPassword),
    upper: /[A-Z]/.test(currentPassword),
    number: /[0-9]/.test(currentPassword),
    special: /[!_.*@#$%^&()\-+]/.test(currentPassword),
    length: currentPassword.length >= 12,
    notSimilar: currentPassword.length > 0 && 
                !emailUsuario.split('@')[0].includes(currentPassword.toLowerCase()) && 
                currentPassword !== emailUsuario
  };

  const onSubmit = (data) => {
    console.log("Contraseña creada exitosamente:", data);
    // llamada api
  };

  return (
    <div className="login-layout-split">
      
      {/* --- COLUMNA IZQUIERDA --- */}
      <section className="login-side-form">
        <div className="login-card-modern">
          
          <div className="card-logo-placeholder" style={{ justifyContent: 'flex-start', padding: 0 }}>
            <img src={logoBind} alt="Logo BIND" width="200" />
          </div>

          <div className="login-header-text">
            <h2>Creá tu contraseña</h2>
            <p>Para el usuario: <span className="text-white" style={{ fontWeight: 'bold' }}>{emailUsuario}</span></p>
          </div>

          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="input-group">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                placeholder=" " 
                {...register("password")}
              />
              <label htmlFor="password">Contraseña *</label>
              
              <button 
                type="button" 
                className="toggle-password-btn" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
              {errors.password && <span className="error-text">{errors.password.message}</span>}
            </div>

            <div className="password-requirements" style={{ margin: "0.5rem 0 1.5rem 0" }}>
              <p className="req-title">La contraseña debe incluir:</p>
              <ul className="req-list">
                <li className={reqs.lower ? "valid" : ""}><CheckIcon valid={reqs.lower} /> Mínimo una minúscula.</li>
                <li className={reqs.upper ? "valid" : ""}><CheckIcon valid={reqs.upper} /> Mínimo una mayúscula.</li>
                <li className={reqs.number ? "valid" : ""}><CheckIcon valid={reqs.number} /> Mínimo un número.</li>
                <li className={reqs.special ? "valid" : ""}><CheckIcon valid={reqs.special} /> Mínimo un caracter especial (!_.*).</li>
                <li className={reqs.length ? "valid" : ""}><CheckIcon valid={reqs.length} /> Mínimo 12 caracteres.</li>
                <li className={reqs.notSimilar ? "valid" : ""}><CheckIcon valid={reqs.notSimilar} /> No debe ser similar al email.</li>
              </ul>
            </div>

            <div className="input-group" style={{ marginBottom: "2rem" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                placeholder=" "
                {...register("confirmPassword")}
              />
              <label htmlFor="confirm-password">Confirmar contraseña *</label>
              
              <button 
                type="button" 
                className="toggle-password-btn" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword.message}</span>}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                style={{ 
                  opacity: isValid ? 1 : 0.5, 
                  cursor: isValid ? 'pointer' : 'not-allowed',
                  marginTop: 0
                }}
                disabled={!isValid}
              >
                CREAR E INGRESAR
              </button>
            </div>
            
          </form>
        </div>
      </section>

      {/* --- COLUMNA DERECHA --- */}
      <section className="login-side-brand" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <FiShield size={80} color="var(--yellow)" strokeWidth={1.5} />
        </div>
        
        <div className="brand-content" style={{ textAlign: 'center' }}>
          <h2 className="brand-title" style={{ fontSize: '2.5rem' }}>Protegé tu cuenta.</h2>
          <p className="brand-subtitle">
            Usá una contraseña fuerte y única. Nunca compartas tus credenciales de acceso con terceros.
          </p>
        </div>

      </section>

    </div>
  );
};

export default CrearClave;