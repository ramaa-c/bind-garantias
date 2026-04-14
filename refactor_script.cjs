const fs = require('fs');
const path = require('path');

const targetClasses = [
    ".calcBtnWrapper", 
    ".actionFooter", 
    ".footer", 
    ".summaryActions", 
    ".actionButtonsGroup", 
    ".actionFooterBorder",
    ".actionsRight",
    ".actions",
    ".saveActionRowCentrado"
];

// Comma-separated list with pseudo elements ? No just normal selectors.
const classesString = targetClasses.join(', ');

const stickyCSS = `
/* Sticky Mobile Footer Action injected by UX Architecture */
@media (max-width: 56.24rem) {
  ${classesString} {
    position: sticky;
    bottom: 0;
    z-index: 40;
    background: rgba(30, 30, 30, 0.85);
    backdrop-filter: blur(12px);
    padding: 1rem 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    margin: 1.5rem -1.5rem -1.5rem -1.5rem;
    border-bottom-left-radius: 1.5rem;
    border-bottom-right-radius: 1.5rem;
  }
}
@media (min-width: 56.25rem) {
  ${classesString} {
    position: relative;
    background: transparent;
    backdrop-filter: none;
    padding: 0;
    border-top: none;
    margin: 1.5rem 0 0 0;
  }
}
`;

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

// 1. Append sticky footer logic to steps in features
walkDir('c:/Users/Ramiro/bind-garantias/src/components/features', function(filePath) {
  if (filePath.endsWith('.module.css')) {
     let content = fs.readFileSync(filePath, 'utf8');
     if (!content.includes('Sticky Mobile Footer Action') && targetClasses.some(c => content.includes(c))) {
         fs.appendFileSync(filePath, '\n' + stickyCSS + '\n');
         console.log("Appended sticky to: " + filePath);
     }
  }
});

// 2. Add padding to main container pages
const mainPagesDirs = [
    'c:/Users/Ramiro/bind-garantias/src/pages/pagares',
    'c:/Users/Ramiro/bind-garantias/src/pages/prestamos',
    'c:/Users/Ramiro/bind-garantias/src/pages/cheques'
];

const seccionFormularioPaddingCSS = `
/* Space for sticky footer */
@media (max-width: 56.24rem) {
  .seccionFormulario {
    padding-bottom: 5rem; 
  }
}
@media (min-width: 56.25rem) {
  .seccionFormulario {
    padding-bottom: 2.5rem; 
  }
}
`;

mainPagesDirs.forEach(dir => {
    walkDir(dir, function(filePath) {
       if (filePath.endsWith('.module.css')) {
           let content = fs.readFileSync(filePath, 'utf8');
           if (content.includes('.seccionFormulario') && !content.includes('Space for sticky footer')) {
               fs.appendFileSync(filePath, '\n' + seccionFormularioPaddingCSS + '\n');
               console.log("Appended padding to: " + filePath);
           }
       }
    });
});

console.log("Done refactoring CSS");
