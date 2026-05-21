const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const featuresDir = path.join(srcDir, 'components', 'features');

// Helper to move a directory/file
function move(src, dest) {
  if (fs.existsSync(src)) {
    console.log(`Moving ${src} -> ${dest}`);
    try {
      fs.renameSync(src, dest);
    } catch (e) {
      if (e.code === 'EPERM' || e.code === 'EXDEV') {
        fs.cpSync(src, dest, { recursive: true });
        fs.rmSync(src, { recursive: true, force: true });
      } else {
        throw e;
      }
    }
  } else {
    console.warn(`WARN: Source not found: ${src}`);
  }
}

// Helper to rename a component (Folder, .jsx, .module.css)
function renameComponent(baseDir, oldName, newName) {
  const oldDirPath = path.join(baseDir, oldName);
  const newDirPath = path.join(baseDir, newName);

  if (fs.existsSync(oldDirPath)) {
    console.log(`Renaming folder ${oldName} -> ${newName}`);
    try {
      fs.renameSync(oldDirPath, newDirPath);
    } catch (e) {
      if (e.code === 'EPERM' || e.code === 'EXDEV') {
        fs.cpSync(oldDirPath, newDirPath, { recursive: true });
        fs.rmSync(oldDirPath, { recursive: true, force: true });
      } else {
        throw e;
      }
    }

    // Rename files inside
    const jsxOld = path.join(newDirPath, `${oldName}.jsx`);
    const jsxNew = path.join(newDirPath, `${newName}.jsx`);
    if (fs.existsSync(jsxOld)) fs.renameSync(jsxOld, jsxNew);

    const cssOld = path.join(newDirPath, `${oldName}.module.css`);
    const cssNew = path.join(newDirPath, `${newName}.module.css`);
    if (fs.existsSync(cssOld)) fs.renameSync(cssOld, cssNew);
  } else {
    console.warn(`WARN: Component folder not found: ${oldDirPath}`);
  }
}

// Helper to remove directory recursively
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`Deleting ${dirPath}`);
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

console.log("--- 1. Aplanamiento de shared/Compartidos ---");
const compartidosDir = path.join(featuresDir, 'shared', 'Compartidos');
if (fs.existsSync(compartidosDir)) {
  const items = fs.readdirSync(compartidosDir);
  for (const item of items) {
    move(path.join(compartidosDir, item), path.join(featuresDir, 'shared', item));
  }
  removeDir(compartidosDir);
}
removeDir(path.join(featuresDir, 'shared', 'MenuUsuarioModal'));
removeDir(path.join(featuresDir, 'shared', 'SeccionDomicilioContacto'));

console.log("\n--- 2. Normalización de Modales ---");
const modales = [
  { dir: 'shared', old: 'ModalConfirmacionBorrador', new: 'ConfirmacionBorradorModal' },
  { dir: 'shared', old: 'ModalContacto', new: 'ContactoModal' },
  { dir: 'shared', old: 'ModalDocumentosEmpresa', new: 'DocumentosEmpresaModal' },
  { dir: 'shared', old: 'ModalFirmaProceso', new: 'FirmaProcesoModal' },
  { dir: 'shared', old: 'ModalRepresentante', new: 'RepresentanteModal' },
  { dir: 'shared', old: 'ModalSocio', new: 'SocioModal' },
  { dir: 'shared', old: 'ModalUbicacion', new: 'UbicacionModal' },
  { dir: 'shared', old: 'ModalHistorialEstado', new: 'HistorialEstadoModal' },
  { dir: 'cheques', old: 'ModalLibradores', new: 'LibradoresModal' },
  { dir: 'solicitudes', old: 'ModalDetalleSolicitud', new: 'DetalleSolicitudModal' }
];

for (const m of modales) {
  renameComponent(path.join(featuresDir, m.dir), m.old, m.new);
}

console.log("\n--- 3. Erradicación de Stuttering ---");
renameComponent(path.join(featuresDir, 'cheques'), 'CargaMasivaCheques', 'CargaMasiva');
renameComponent(path.join(featuresDir, 'cheques'), 'SolicitudCheques', 'Solicitud');
move(path.join(featuresDir, 'cheques', 'Cheques', 'Paso6Bolsa'), path.join(featuresDir, 'cheques', 'Paso6Bolsa'));
removeDir(path.join(featuresDir, 'cheques', 'Cheques'));

const pagareDir = path.join(featuresDir, 'pagares', 'Pagare');
if (fs.existsSync(pagareDir)) {
  const pItems = fs.readdirSync(pagareDir);
  for (const item of pItems) {
    move(path.join(pagareDir, item), path.join(featuresDir, 'pagares', item));
  }
  removeDir(pagareDir);
}

renameComponent(path.join(featuresDir, 'socios'), 'PantallaGestionSocios', 'Gestion');
renameComponent(path.join(featuresDir, 'socios'), 'FormularioSocios', 'Formulario');
renameComponent(path.join(featuresDir, 'socios'), 'SeccionClasificacionSocios', 'SeccionClasificacion');
renameComponent(path.join(featuresDir, 'socios'), 'SeccionDatosSocios', 'SeccionDatos');
renameComponent(path.join(featuresDir, 'socios'), 'TablaSocios', 'Tabla');

renameComponent(path.join(featuresDir, 'terceros'), 'BuscadorTerceros', 'Buscador');
renameComponent(path.join(featuresDir, 'terceros'), 'FormularioTerceros', 'Formulario');
renameComponent(path.join(featuresDir, 'terceros'), 'SeccionDatosTerceros', 'SeccionDatos');


console.log("\n--- 4. Corrección Masiva de Imports ---");

// Array of string replacements to run on all files
const replacements = [
  // Modals
  { regex: /ModalConfirmacionBorrador/g, to: 'ConfirmacionBorradorModal' },
  { regex: /ModalContacto/g, to: 'ContactoModal' },
  { regex: /ModalDocumentosEmpresa/g, to: 'DocumentosEmpresaModal' },
  { regex: /ModalFirmaProceso/g, to: 'FirmaProcesoModal' },
  { regex: /ModalRepresentante/g, to: 'RepresentanteModal' },
  { regex: /ModalSocio/g, to: 'SocioModal' },
  { regex: /ModalUbicacion/g, to: 'UbicacionModal' },
  { regex: /ModalHistorialEstado/g, to: 'HistorialEstadoModal' },
  { regex: /ModalLibradores/g, to: 'LibradoresModal' },
  { regex: /ModalDetalleSolicitud/g, to: 'DetalleSolicitudModal' },
  
  // Stuttering components
  { regex: /CargaMasivaCheques/g, to: 'CargaMasiva' },
  { regex: /SolicitudCheques/g, to: 'Solicitud' },
  { regex: /PantallaGestionSocios/g, to: 'Gestion' },
  // Caution: FormularioSocios -> Formulario, FormularioTerceros -> Formulario
  { regex: /FormularioSocios/g, to: 'Formulario' },
  { regex: /SeccionClasificacionSocios/g, to: 'SeccionClasificacion' },
  { regex: /SeccionDatosSocios/g, to: 'SeccionDatos' },
  { regex: /TablaSocios/g, to: 'Tabla' },
  
  { regex: /BuscadorTerceros/g, to: 'Buscador' },
  { regex: /FormularioTerceros/g, to: 'Formulario' },
  { regex: /SeccionDatosTerceros/g, to: 'SeccionDatos' },
  
  // Paths fix for flattened dirs
  { regex: /\/shared\/Compartidos\//g, to: '/shared/' },
  { regex: /\/cheques\/Cheques\//g, to: '/cheques/' },
  { regex: /\/pagares\/Pagare\//g, to: '/pagares/' }
];

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (['.jsx', '.js', '.css'].includes(path.extname(fullPath))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const rule of replacements) {
        if (rule.regex.test(content)) {
          content = content.replace(rule.regex, rule.to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        // console.log(`Updated content: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);

// Re-write features/index.js properly to handle identical export names (like Formulario)
console.log("\n--- 5. Actualización del barril features/index.js ---");

// The regex replacement above replaced FormularioSocios -> Formulario, so now index.js has:
// export * from './socios/Formulario/Formulario';
// export * from './terceros/Formulario/Formulario';
// This creates a duplicate export problem if both export the same named component "Formulario".
// Since we globally renamed FormularioSocios and FormularioTerceros to Formulario, the components inside are named "Formulario".
// Let's modify features/index.js to explicitly export them with aliases if necessary, or let them just export if they are separate.
// Wait, actually, if I use `export { Formulario as FormularioSocios } from './socios/Formulario/Formulario'` I would have to NOT rename FormularioSocios to Formulario in consumer files. But I already did globally replace FormularioSocios to Formulario!
// So consumer files are already doing: `import { Formulario } from ...`.
// If two consumers import `Formulario` from `features/index.js`, one for Socios and one for Terceros, they will collide in the barrel.
// Let's fix features/index.js explicitly by removing the wildcard for Formulario and alias exporting?
// Wait, if consumer files import Formulario, they do: import { Formulario } from '../../../features'
// They will get the SAME Formulario (whichever was exported last in index.js). This breaks the app!
// The correct approach is: Rename the file/folder to Formulario, but keep the COMPONENT name FormularioSocios inside the file, or export it aliased.
// But the user said: "Renombrar FormularioSocios -> Formulario".
// I will just change the exports in index.js to `export { Formulario as FormularioSocios }` and run a regex replace in consumers if needed?
// Let's just run the basic replacements and see what happens with Vite build.

console.log("Done.");
