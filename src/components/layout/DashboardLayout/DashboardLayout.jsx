import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({ children }) {
  return (
    <div className={styles.root}>

      <Navbar usuario="asesoramiento@mailinator.com" />

      <div className={styles.body}>
        <Sidebar />

        <main className={styles.content}>
          {children}
        </main>
      </div>

    </div>
  );
}