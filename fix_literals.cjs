const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
        walkDir(dirPath, callback);
    } else {
        callback(dirPath);
    }
  });
}

walkDir('c:/Users/Ramiro/bind-garantias/src', function(filePath) {
  if (filePath.endsWith('.module.css')) {
     let content = fs.readFileSync(filePath, 'utf8');
     // Reemplazar la barra invertida literal más 'n' por un salto de línea real.
     const regex = /\\n/g;
     if (regex.test(content)) {
         content = content.replace(regex, '\n');
         fs.writeFileSync(filePath, content);
         console.log('Fixed literal \\n in: ' + filePath);
     }
  }
});
