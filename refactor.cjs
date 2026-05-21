const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

// Update imports
function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else {
            if (['.js', '.jsx', '.css'].includes(path.extname(fullPath))) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let newContent = content;

                // Rename components/classes
                newContent = newContent.replace(/AdminBanners/g, 'Banners');
                newContent = newContent.replace(/AdminCadenasValor/g, 'CadenasValor');
                newContent = newContent.replace(/AdminDashboard/g, 'Dashboard');
                newContent = newContent.replace(/AdminRolesPermisos/g, 'RolesPermisos');
                newContent = newContent.replace(/AdminTasasMontos/g, 'TasasMontos');
                newContent = newContent.replace(/AdminTerminos/g, 'Terminos');
                newContent = newContent.replace(/PantallaGestionUsuarios/g, 'Gestion');

                // Guards
                newContent = newContent.replace(/layout\/AdminGuard/g, 'guards/AdminGuard');
                newContent = newContent.replace(/layout\/OnboardingGuard/g, 'guards/OnboardingGuard');

                // Features
                newContent = newContent.replace(/features\/Socios/g, 'features/socios');
                newContent = newContent.replace(/features\/Terceros/g, 'features/terceros');
                newContent = newContent.replace(/features\/CargaMasivaCheques/g, 'features/cheques/CargaMasivaCheques');
                newContent = newContent.replace(/features\/ModalLibradores/g, 'features/cheques/ModalLibradores');
                newContent = newContent.replace(/features\/MenuUsuarioModal/g, 'features/shared/MenuUsuarioModal');
                newContent = newContent.replace(/features\/ModalHistorialEstado/g, 'features/shared/ModalHistorialEstado');
                newContent = newContent.replace(/features\/TasasModal/g, 'features/shared/TasasModal');

                // Layouts
                newContent = newContent.replace(/layout\/AdminLayout/g, 'layout/Admin/AdminLayout');
                newContent = newContent.replace(/layout\/AdminNavbar/g, 'layout/Admin/AdminNavbar');
                newContent = newContent.replace(/layout\/Navbar/g, 'layout/Client/Navbar');
                newContent = newContent.replace(/layout\/Sidebar/g, 'layout/Client/Sidebar');
                newContent = newContent.replace(/layout\/HelpDrawer/g, 'layout/Client/HelpDrawer');

                // Fixes for relative imports (e.g. from components/features/index.js)
                newContent = newContent.replace(/\.\/CargaMasivaCheques/g, './cheques/CargaMasivaCheques');
                newContent = newContent.replace(/\.\/ModalLibradores/g, './cheques/ModalLibradores');
                newContent = newContent.replace(/\.\/MenuUsuarioModal/g, './shared/MenuUsuarioModal');
                newContent = newContent.replace(/\.\/ModalHistorialEstado/g, './shared/ModalHistorialEstado');
                newContent = newContent.replace(/\.\/TasasModal/g, './shared/TasasModal');
                
                newContent = newContent.replace(/\.\/Socios/g, './socios');
                newContent = newContent.replace(/\.\/Terceros/g, './terceros');
                
                // Fix layout index.js if it exists
                newContent = newContent.replace(/\.\/AdminGuard/g, '../guards/AdminGuard');
                newContent = newContent.replace(/\.\/OnboardingGuard/g, '../guards/OnboardingGuard');
                newContent = newContent.replace(/\.\/AdminLayout/g, './Admin/AdminLayout');
                newContent = newContent.replace(/\.\/AdminNavbar/g, './Admin/AdminNavbar');
                newContent = newContent.replace(/\.\/Navbar/g, './Client/Navbar');
                newContent = newContent.replace(/\.\/Sidebar/g, './Client/Sidebar');
                newContent = newContent.replace(/\.\/HelpDrawer/g, './Client/HelpDrawer');

                if (content !== newContent) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    console.log(`Updated imports in: ${fullPath.replace(rootDir, '')}`);
                }
            }
        }
    }
}

processDir(srcDir);
console.log('Imports update complete.');
