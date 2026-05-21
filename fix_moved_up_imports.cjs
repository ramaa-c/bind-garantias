const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'components', 'features');

const movedUpFolders = [
  'shared/DocumentosLegajo',
  'shared/ConfirmacionBorradorModal', // renamed from ModalConfirmacionBorrador
  'shared/ContactoModal',             // renamed
  'shared/DocumentosEmpresaModal',
  'shared/FirmaProcesoModal',
  'shared/RepresentanteModal',
  'shared/SocioModal',
  'shared/UbicacionModal',
  'shared/PanelDudas',
  'shared/Paso1Cuit',
  'shared/Paso2Datos',
  'shared/Paso3Simulador',
  'shared/Paso4Socios',
  'shared/Paso5Documentacion',
  'shared/Paso7Exito',
  'shared/SocioItem',
  'shared/SocioTaskCard',
  'cheques/Paso6Bolsa',
  'pagares/Paso1SimuladorPagare',
  'pagares/Paso2AgentePagare',
  'pagares/Paso3Epyme',
  'pagares/Paso4ExitoPagare'
];

function fixImports(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`WARN: Directory not found: ${dirPath}`);
    return;
  }
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (['.jsx', '.js', '.css'].includes(path.extname(fullPath))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Reduce all relative depths by 1 level
      // ../../../../../ -> ../../../../
      // ../../../../ -> ../../../
      // ../../../ -> ../../
      // ../../ -> ../
      // Very simple: replace `../` sequence with sequence minus one
      
      content = content.replace(/(\.\.\/)+/g, (match) => {
          // match is like "../../../"
          // count number of '../'
          const count = match.length / 3;
          if (count > 1) {
              return '../'.repeat(count - 1);
          } else {
              return './'; // If it was '../', it becomes './' since it moved UP one level!
          }
      });

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Fixed imports in ${fullPath}`);
    }
  }
}

for (const folder of movedUpFolders) {
  fixImports(path.join(srcDir, folder));
}
