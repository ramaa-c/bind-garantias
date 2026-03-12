import styles from "./AppLayout.module.css";

export const AppLayout = ({ sidebar, children }) => {
  return (
    <div className={styles.root}>
      <div className={styles.body}>
        {sidebar}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
};
