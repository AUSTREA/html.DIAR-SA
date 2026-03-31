// Fecha y hora automáticas
window.onload = () => {
  const fecha = new Date();
  document.getElementById("fecha").textContent =
    `Fecha: ${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
  document.getElementById("hora").textContent =
    `Hora: ${fecha.getHours()}:${fecha.getMinutes().toString().padStart(2, '0')}`;
};

// Recalcular totales al escribir
document.addEventListener("input", calcularFactura);

function calcularFactura() {
  const filas = document.querySelectorAll("#tabla-servicios tbody tr");
  let subtotalGeneral = 0;

  filas.forEach(fila => {
    const inputCant = fila.querySelector(".cant");
    const inputCosto = fila.querySelector(".costo");

    let cant = 0, costo = 0;

    if (inputCant && inputCosto) {
      cant = parseFloat(inputCant.value) || 0;
      costo = parseFloat(inputCosto.value) || 0;
      const subtotal = cant * costo;
      fila.querySelector(".subtotal").textContent = formatoQuetzal(subtotal);
      subtotalGeneral += subtotal;
    } else {
      // Modo XML con texto plano
      const textoCant = parseFloat(fila.cells[0]?.textContent) || 0;
      const textoCosto = fila.cells[2]?.textContent || "";
      costo = parseFloat(textoCosto.replace("Q", "").replace(",", "").trim()) || 0;
      const subtotal = textoCant * costo;
      fila.querySelector(".subtotal").textContent = formatoQuetzal(subtotal);
      subtotalGeneral += subtotal;
    }
  });

  const iva = subtotalGeneral * 0.12;
  const total = subtotalGeneral + iva;

  document.getElementById("subtotal").textContent = formatoQuetzal(subtotalGeneral);
  document.getElementById("iva").textContent = formatoQuetzal(iva);
  document.getElementById("total").textContent = formatoQuetzal(total);
  document.getElementById("total-letras").textContent = numeroALetras(total);
}

// Convierte número a letras (simplificado o completo)
function numeroALetras(num) {
  const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const especiales = {
    10: "diez", 11: "once", 12: "doce", 13: "trece", 14: "catorce", 15: "quince",
    16: "dieciséis", 17: "diecisiete", 18: "dieciocho", 19: "diecinueve"
  };

  function convertirParteEntera(n) {
    if (n === 0) return "cero";
    let resultado = "";

    if (n >= 1000000) {
      const millones = Math.floor(n / 1000000);
      resultado += convertirParteEntera(millones) + " millón" + (millones > 1 ? "es " : " ");
      n %= 1000000;
    }

    if (n >= 1000) {
      const miles = Math.floor(n / 1000);
      resultado += (miles === 1 ? "mil " : convertirParteEntera(miles) + " mil ");
      n %= 1000;
    }

    if (n >= 100) {
      const centenas = Math.floor(n / 100);
      resultado += (centenas === 1 && n % 100 === 0 ? "cien " : ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"][centenas] + " ");
      n %= 100;
    }

    if (n >= 10 && n <= 19) {
      resultado += especiales[n] + " ";
    } else {
      const dec = Math.floor(n / 10);
      const uni = n % 10;
      resultado += decenas[dec];
      if (dec > 1 && uni > 0) resultado += " y ";
      resultado += unidades[uni] + " ";
    }

    return resultado.trim();
  }

  const entero = Math.floor(num);
  const centavos = Math.round((num - entero) * 100);

  return `${convertirParteEntera(entero)} quetzales con ${convertirParteEntera(centavos)} centavos`;
}

// Formato de moneda quetzal
function formatoQuetzal(num) {
  return "Q " + num.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Cargar datos desde XML
function cargarXML() {
  const input = document.getElementById("archivoXML");
  const file = input.files[0];
  if (!file) return alert("Selecciona un archivo XML");

  const reader = new FileReader();
  reader.onload = function (e) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(e.target.result, "text/xml");

    // Datos generales
    const datosGen = xmlDoc.getElementsByTagName("dte:DatosGenerales")[0];
    const fechaHora = datosGen?.getAttribute("FechaHoraEmision") || "";
    const [fecha, hora] = fechaHora.split("T");
    document.getElementById("autorizacion").textContent =
      "Autorización: " + (xmlDoc.getElementsByTagName("dte:NumeroAutorizacion")[0]?.textContent || "");
    document.getElementById("fecha").textContent = "Fecha: " + fecha;
    document.getElementById("hora").textContent = "Hora: " + (hora?.split("-")[0] || "");

    // Emisor
    const emisor = xmlDoc.getElementsByTagName("dte:Emisor")[0];
    document.getElementById("nombreEmisor").textContent = emisor?.getAttribute("NombreEmisor") || "—";
    document.getElementById("nitEmisor").textContent = emisor?.getAttribute("NITEmisor") || "—";
    const dirEmisor = xmlDoc.getElementsByTagName("dte:DireccionEmisor")[0];
    const muniEm = dirEmisor?.getElementsByTagName("dte:Municipio")[0]?.textContent || "";
    const deptoEm = dirEmisor?.getElementsByTagName("dte:Departamento")[0]?.textContent || "";
    const paisEm = dirEmisor?.getElementsByTagName("dte:Pais")[0]?.textContent || "";
    document.getElementById("direccionEmisor").textContent = `${muniEm}, ${deptoEm}, ${paisEm}`;

    // Receptor
    const receptor = xmlDoc.getElementsByTagName("dte:Receptor")[0];
    document.getElementById("nombreReceptor").textContent = receptor?.getAttribute("NombreReceptor") || "—";
    document.getElementById("nitReceptor").textContent = receptor?.getAttribute("IDReceptor") || "—";
    const muniRec = xmlDoc.getElementsByTagName("dte:Municipio")[0]?.textContent || "";
    const deptoRec = xmlDoc.getElementsByTagName("dte:Departamento")[0]?.textContent || "";
    const paisRec = xmlDoc.getElementsByTagName("dte:Pais")[0]?.textContent || "";
    document.getElementById("direccionReceptor").textContent = `${muniRec}, ${deptoRec}, ${paisRec}`;

    // Servicios
    const items = xmlDoc.getElementsByTagName("dte:Item");
    const tbody = document.getElementById("items");
    tbody.innerHTML = "";

    Array.from(items).forEach(item => {
      const cantidad = item.getElementsByTagName("dte:Cantidad")[0]?.textContent || "0";
      const descripcion = item.getElementsByTagName("dte:Descripcion")[0]?.textContent || "";
      const precio = parseFloat(item.getElementsByTagName("dte:PrecioUnitario")[0]?.textContent || "0");
      const subtotal = (parseFloat(cantidad) * precio).toFixed(2);

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${cantidad}</td>
        <td>${descripcion}</td>
        <td>${formatoQuetzal(precio)}</td>
        <td class="subtotal">${formatoQuetzal(parseFloat(subtotal))}</td>
      `;
      tbody.appendChild(fila);
    });

    // Totales
    const iva = parseFloat(xmlDoc.getElementsByTagName("dte:TotalImpuesto")[0]?.getAttribute("TotalMontoImpuesto") || "0");
    const total = parseFloat(xmlDoc.getElementsByTagName("dte:GranTotal")[0]?.textContent || "0");
    document.getElementById("iva").textContent = formatoQuetzal(iva);
    document.getElementById("total").textContent = formatoQuetzal(total);
    document.getElementById("total-letras").textContent =
      xmlDoc.getElementsByTagName("dte:TextoTotal")[0]?.textContent || numeroALetras(total);

    // QR SAT (simulado)
    const qr = document.getElementById("qr");
    if (qr) qr.innerHTML = `<img src="PICTURES/qr-sat.png" alt="QR SAT" style="width:100px;">`;

    // Recalcular totales por si hay cambios manuales
    calcularFactura();
  };

  reader.readAsText(file);
}

// Descargar en tamaño carta
function descargarPDF() {
  const factura = document.getElementById("factura");
  const ventana = window.open("", "PRINT", "height=800,width=600");
  ventana.document.write("<html><head><title>Factura</title>");
  ventana.document.write('<style>@media print { body { margin: 2cm; font-family: Arial; } }</style>');
  ventana.document.write("</head><body>");
  ventana.document.write(factura.outerHTML);
  ventana.document.write("</body></html>");
  ventana.document.close();
  ventana.focus();
  ventana.print();
  ventana.close();
}
