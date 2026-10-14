#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEVINLINE_URL =
  process.env.PUBLICAR_DEVINLINE_URL || "http://192.168.2.70:3000/Devinline/SGRPlusWebFront.git";
const REMOTOS = [
  { remoto: "origin", nombre: "GitHub" },
  { remoto: "devinline", nombre: "Devinline" },
];
const RAMAS_COMPARTIDAS = ["dev", "main"];
const RAMAS_PROTEGIDAS = ["dev", "main"];

class ErrorPublicar extends Error {}

const ejecutar = (comando, args, { permitirFallo = false } = {}) => {
  const res = spawnSync(comando, args, {
    cwd: RAIZ,
    encoding: "utf8",
    shell: comando !== "git",
    maxBuffer: 64 * 1024 * 1024,
  });
  const salida = `${res.stdout || ""}${res.stderr || ""}`.trim();
  if (res.status !== 0 && !permitirFallo) {
    throw new ErrorPublicar(`Falló: ${comando} ${args.join(" ")}\n${ultimasLineas(salida)}`);
  }
  return { ok: res.status === 0, salida };
};

const git = (...args) => ejecutar("git", args).salida;
const gitSinFallo = (...args) => ejecutar("git", args, { permitirFallo: true });

const ultimasLineas = (texto, cantidad = 25) => texto.split(/\r?\n/).slice(-cantidad).join("\n");

const sha = (ref) => {
  const res = gitSinFallo("rev-parse", "--verify", "-q", `${ref}^{commit}`);
  return res.ok ? res.salida : null;
};

const esAncestro = (a, b) => gitSinFallo("merge-base", "--is-ancestor", a, b).ok;

const relacion = (a, b) => {
  const shaA = sha(a);
  const shaB = sha(b);
  if (!shaA && !shaB) return "no existe en ninguno";
  if (!shaA) return "falta la primera";
  if (!shaB) return "falta la segunda";
  if (shaA === shaB) return "igual";
  if (esAncestro(shaA, shaB)) return "atras";
  if (esAncestro(shaB, shaA)) return "adelante";
  return "divergente";
};

const asegurarRemotos = () => {
  const remotos = git("remote").split(/\r?\n/);
  if (!remotos.includes("origin")) {
    throw new ErrorPublicar("No existe el remoto 'origin' (GitHub).");
  }
  if (!remotos.includes("devinline")) {
    git("remote", "add", "devinline", DEVINLINE_URL);
  }
};

const traerAmbos = () => {
  for (const { remoto, nombre } of REMOTOS) {
    const res = gitSinFallo("fetch", remoto, "--prune");
    if (!res.ok) {
      throw new ErrorPublicar(`No se pudo traer ${nombre} (${remoto}).\n${ultimasLineas(res.salida)}`);
    }
  }
};

const ramaActual = () => git("rev-parse", "--abbrev-ref", "HEAD");

const cambiosSinCommitear = () => git("status", "--porcelain");

const describirRelacion = (rel, a, b) => {
  switch (rel) {
    case "igual":
      return `${a} y ${b} están iguales`;
    case "atras":
      return `${a} está atrás de ${b}`;
    case "adelante":
      return `${a} está adelante de ${b}`;
    case "divergente":
      return `${a} y ${b} tienen historiales distintos`;
    case "falta la primera":
      return `no existe en ${a}`;
    case "falta la segunda":
      return `no existe en ${b}`;
    default:
      return "no existe en ninguno de los dos";
  }
};

export const estado = () => {
  asegurarRemotos();
  traerAmbos();
  const rama = ramaActual();
  const lineas = [`Rama actual: ${rama}`];
  const pendientes = cambiosSinCommitear();
  lineas.push(pendientes ? `Cambios sin commitear:\n${pendientes}` : "Sin cambios sin commitear.");
  if (rama !== "HEAD" && !RAMAS_COMPARTIDAS.includes(rama)) {
    lineas.push(`- ${rama} (solo GitHub): ${describirRelacion(relacion(rama, `origin/${rama}`), "local", "GitHub")}`);
  }
  for (const r of RAMAS_COMPARTIDAS) {
    lineas.push(`- ${r}: ${describirRelacion(relacion(`origin/${r}`, `devinline/${r}`), "GitHub", "Devinline")}`);
  }
  return lineas.join("\n");
};

const sincronizarRama = (r) => {
  const rel = relacion(`origin/${r}`, `devinline/${r}`);
  if (rel === "igual" || rel === "no existe en ninguno") return `${r}: sin cambios.`;
  if (rel === "divergente") {
    throw new ErrorPublicar(
      `${r}: GitHub y Devinline tienen historiales distintos. No se fuerza nada: hay que unificarlos a mano.`,
    );
  }
  const [origen, destino] =
    rel === "atras" || rel === "falta la primera"
      ? [{ remoto: "devinline", nombre: "Devinline" }, { remoto: "origin", nombre: "GitHub" }]
      : [{ remoto: "origin", nombre: "GitHub" }, { remoto: "devinline", nombre: "Devinline" }];
  git("push", destino.remoto, `${origen.remoto}/${r}:refs/heads/${r}`);
  return `${r}: ${destino.nombre} actualizado con lo de ${origen.nombre}.`;
};

export const sincronizar = ({ ramas = RAMAS_COMPARTIDAS } = {}) => {
  asegurarRemotos();
  traerAmbos();
  return ramas.map(sincronizarRama).join("\n");
};

export const publicar = ({ mergearDev = false } = {}) => {
  asegurarRemotos();
  const rama = ramaActual();
  if (rama === "HEAD") throw new ErrorPublicar("No estás parado en ninguna rama.");
  if (RAMAS_PROTEGIDAS.includes(rama)) {
    throw new ErrorPublicar(`Estás en '${rama}'. Publicá desde tu rama (por ejemplo feature-mati o feature-rama).`);
  }
  const pendientes = cambiosSinCommitear();
  if (pendientes) throw new ErrorPublicar(`Hay cambios sin commitear:\n${pendientes}`);

  const pasos = [];
  traerAmbos();
  pasos.push(sincronizarRama("dev"));

  if (!esAncestro("origin/dev", "HEAD")) {
    const merge = gitSinFallo("merge", "--no-edit", "origin/dev");
    if (!merge.ok) {
      gitSinFallo("merge", "--abort");
      throw new ErrorPublicar(
        `Traer dev a '${rama}' da conflictos. Hacé el merge de origin/dev a mano, resolvelo y volvé a publicar.\n${ultimasLineas(merge.salida)}`,
      );
    }
    pasos.push(`Se trajo dev a '${rama}'.`);
  }

  if (sha(`origin/${rama}`) && !esAncestro(`origin/${rama}`, "HEAD")) {
    throw new ErrorPublicar(
      `'${rama}' en GitHub tiene commits que no están en tu copia local. Traelos (git pull origin ${rama}) antes de publicar.`,
    );
  }

  const lint = ejecutar("npm", ["run", "lint"], { permitirFallo: true });
  if (!lint.ok) throw new ErrorPublicar(`El lint falló, no se subió nada.\n${ultimasLineas(lint.salida)}`);
  pasos.push("Lint OK.");
  const build = ejecutar("npm", ["run", "build"], { permitirFallo: true });
  if (!build.ok) throw new ErrorPublicar(`El build falló, no se subió nada.\n${ultimasLineas(build.salida)}`);
  pasos.push("Build OK.");

  const subir = (remoto, nombre, destino) => {
    const res = gitSinFallo("push", remoto, `HEAD:refs/heads/${destino}`);
    if (!res.ok) {
      throw new ErrorPublicar(
        `${nombre} rechazó el push de '${destino}'.\n${pasos.join("\n")}\n${ultimasLineas(res.salida)}`,
      );
    }
    pasos.push(`${destino} subido a ${nombre}.`);
  };

  subir("origin", "GitHub", rama);
  if (mergearDev) {
    for (const { remoto, nombre } of REMOTOS) subir(remoto, nombre, "dev");
  }

  if (mergearDev && sha("dev") && esAncestro("dev", "HEAD")) {
    git("branch", "-f", "dev", "HEAD");
    pasos.push("dev local actualizado.");
  }

  return pasos.join("\n");
};

const ayuda = `Uso:
  npm run publicar               Trae dev, corre lint y build y sube tu rama a GitHub
  npm run publicar -- --dev      Igual, y además actualiza dev en GitHub y Devinline con tu rama
  npm run publicar:estado        Muestra cómo está tu rama en GitHub y dev/main en los dos repos
  npm run publicar:sincronizar   Copia dev y main al repo que esté atrás (nunca fuerza)`;

const esPrincipal = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (esPrincipal) {
  const [comando = "publicar", ...resto] = process.argv.slice(2);
  try {
    if (comando === "estado") console.log(estado());
    else if (comando === "sincronizar") console.log(sincronizar());
    else if (comando === "publicar") console.log(publicar({ mergearDev: resto.includes("--dev") }));
    else {
      console.log(ayuda);
      process.exitCode = comando === "ayuda" ? 0 : 1;
    }
  } catch (e) {
    console.error(e instanceof ErrorPublicar ? e.message : e);
    process.exitCode = 1;
  }
}
