const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const featuresDir = path.join(srcDir, 'components', 'features');

const pagesMapping = {
  auth: ['Login', 'Registro', 'ConfirmarCorreo', 'CrearClave', 'AceptarTerminos'],
  dashboard: ['Inicio'],
  cheques: ['Cheques', 'SolicitudCheques', 'CargaMasivaCheques'],
  prestamos: ['Prestamos', 'PrestamosFijos', 'PrestamosFijosPasos', 'PrestamosPasos', 'PrestamosSeleccionables', 'PrestamosSeleccionablesPasos'],
  pagares: ['Pagare', 'PagarePasos', 'SolicitudPagare', 'FirmaDocumento'],
  solicitudes: ['Solicitudes', 'TarjetaSolicitud'] // Note: TarjetaSolicitud is in features, checking if error
};

// Remove TarjetaSolicitud from pages mapping, it's a feature.
pagesMapping.solicitudes = ['Solicitudes'];

const featuresMapping = {
  dashboard: ['ListaActividades', 'TarjetaLinea'],
  cheques: ['CargaMasivaCheques', 'Cheques', 'SolicitudCheques'],
  pagares: ['Pagare'],
  solicitudes: ['TarjetaSolicitud'],
  shared: ['Compartidos']
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function updateImports(filePath) {
  if (!fs.existsSync(filePath)) return;
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    fs.readdirSync(filePath).forEach(child => updateImports(path.join(filePath, child)));
  } else if (filePath.match(/\.(js|jsx|ts|tsx)$/)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Shift ../ by one level
    const newContent = content.replace(/(['"])((\.\.\/)+)/g, (match, quote, dots) => {
      return quote + '../' + dots;
    });
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated imports in ${filePath}`);
    }
  }
}

// 1. Create domain folders
console.log('Creating domain directories...');
Object.keys(pagesMapping).forEach(domain => ensureDir(path.join(pagesDir, domain)));
Object.keys(featuresMapping).forEach(domain => ensureDir(path.join(featuresDir, domain)));

// 2. Move Pages
console.log('Moving pages...');
Object.entries(pagesMapping).forEach(([domain, files]) => {
  const domainDir = path.join(pagesDir, domain);
  files.forEach(fileBase => {
    // Look for all extensions of this file: .jsx, .module.css, .js
    ['.jsx', '.js', '.module.css'].forEach(ext => {
      const srcFile = path.join(pagesDir, fileBase + ext);
      const destFile = path.join(domainDir, fileBase + ext);
      if (fs.existsSync(srcFile)) {
        fs.renameSync(srcFile, destFile);
        console.log(`Moved ${fileBase}${ext} to ${domain}`);
        // If it's a script, update its imports
        if (['.jsx', '.js'].includes(ext)) {
            updateImports(destFile);
        }
      }
    });
  });
});

// 3. Move Features
console.log('Moving features...');
const featuresIndexMap = {}; // mapping from old folder name to new relative path from index.js
Object.entries(featuresMapping).forEach(([domain, folders]) => {
  const domainDir = path.join(featuresDir, domain);
  folders.forEach(folder => {
    // case mapping: need to find actual folder case because list_dir showed CargaMasivaCheques, Cheques, Compartidos, ListaActividades, Pagare, SolicitudCheques, TarjetaLinea, TarjetaSolicitud
    // Node.js on windows is case insensitive but it's better to be precise.
    const srcFolder = path.join(featuresDir, folder);
    const destFolder = path.join(domainDir, folder);
    if (fs.existsSync(srcFolder)) {
      fs.renameSync(srcFolder, destFolder);
      console.log(`Moved feature ${folder} to ${domain}`);
      // Update imports inside the feature dir
      updateImports(destFolder);
      
      // Save for index.js update
      featuresIndexMap[folder.toLowerCase()] = `./${domain}/${folder}`;
    } else {
        console.log(`Warning: Feature directory ${folder} not found`);
    }
  });
});

// 4. Update src/components/features/index.js
const indexPath = path.join(featuresDir, 'index.js');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  // Match exports like: export { default as Paso1 } from './compartidos/Paso1/Paso1';
  // old patterns were './compartidos/', './Cheques/', etc.
  
  indexContent = indexContent.replace(/(['"])\.\/([^/]+)/g, (match, quote, rootFolder) => {
    const key = rootFolder.toLowerCase();
    if (featuresIndexMap[key]) {
      return quote + featuresIndexMap[key];
    }
    return match;
  });
  
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log('Updated src/components/features/index.js');
}

console.log('Migration Phase 1 and 2 completed.');
