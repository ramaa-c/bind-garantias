import React, { useState, useEffect } from "react";
import { FiUsers as FiUsersIcon } from "react-icons/fi";
import { SociosLegajo } from "../../../../components/features";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import styles from "./SociosView.module.css";

export default function SociosView() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  return (
    <section className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconCircleSmall}>
            <FiUsersIcon />
          </div>
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>Perfil de socios</h1>
            <p className={styles.subtitle}>
              Gestioná la composición accionaria, representantes y
              vinculaciones.
            </p>
          </div>
        </div>
      </header>

      <div className={styles.formLayout}>
        <SociosLegajo />
      </div>

      <HelpDrawer
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        contexto="inicio"
      />
    </section>
  );
}
