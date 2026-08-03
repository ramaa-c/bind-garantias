import { parseAddress } from "./src/utils/direccionParser.js";

const addr = "MANUEL CARDE&#209;OSA Y FRAY LUIS BELTRAN 0 Piso:PB Dpto:G080";
console.log(parseAddress(addr));
