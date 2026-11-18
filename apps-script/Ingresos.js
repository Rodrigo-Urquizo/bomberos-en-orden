/**
 * Registro de ingresos: insumos comprados o donados por la ciudadanía.
 *
 * registrarIngreso() lo llama el formulario del panel. Escribe en la hoja con la
 * cuenta de quien usa el panel: si esa cuenta solo puede ver la hoja (no editarla),
 * Google rechaza la escritura y no se registra nada.
 *
 * - Si ya existe una fila del mismo artículo (mismo andamio, presentación, talla y
 *   fecha de expiración), suma la cantidad a esa fila.
 * - Si no existe, agrega una fila nueva al final de la pestaña de inventario.
 * - Cada registro queda anotado en la pestaña "Registro de ingresos"
 *   (quién, cuándo y qué), que se crea sola la primera vez.
 *
 * Usa HOJA_ID y PESTANA de Codigo.js.
 */

const HOJA_HISTORIAL = 'Registro de ingresos';
const ORIGENES = ['Compra', 'Donación'];
const COLUMNAS_EXTRA = ['Origen', 'Fecha de ingreso', 'Registrado por'];
const ENCABEZADOS_HISTORIAL = [
  'Fecha y hora', 'Registrado por', 'Origen', 'Andamio', 'Categoría', 'Artículo',
  'Unidad de medida', 'Contenido', 'Talla', 'Cantidad', 'Fecha de expiración',
  'Proveedor o donante', 'Nota', 'Resultado',
];
const MESES_ABREVIADOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function normalizarTexto_(texto) {
  return String(texto == null ? '' : texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Quita saltos de línea y caracteres de control, y limita el largo.
function limpiarCampo_(valor, maximo) {
  return String(valor == null ? '' : valor).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, maximo);
}

// En la hoja, "-" significa "no aplica".
function paraComparar_(valor) {
  const t = normalizarTexto_(valor);
  return t === '-' ? '' : t;
}

// 0 -> A, 25 -> Z, 26 -> AA
function letraColumna_(indice) {
  let n = indice + 1;
  let letra = '';
  while (n > 0) {
    const resto = (n - 1) % 26;
    letra = String.fromCharCode(65 + resto) + letra;
    n = Math.floor((n - 1) / 26);
  }
  return letra;
}

function citarPestana_(nombre) {
  return "'" + String(nombre).replace(/'/g, "''") + "'";
}

// Comprueba los datos del formulario. Devuelve { error } o { datos }.
function validarIngreso_(entrada) {
  const e = entrada || {};
  const datos = {
    origen: limpiarCampo_(e.origen, 20),
    andamio: limpiarCampo_(e.andamio, 60),
    categoria: limpiarCampo_(e.categoria, 60),
    articulo: limpiarCampo_(e.articulo, 100),
    unidad: limpiarCampo_(e.unidad, 20),
    contenido: limpiarCampo_(e.contenido, 40),
    talla: limpiarCampo_(e.talla, 20),
    vencimiento: limpiarCampo_(e.vencimiento, 10).toLowerCase(),
    contraparte: limpiarCampo_(e.contraparte, 100),
    nota: limpiarCampo_(e.nota, 200),
    cantidad: Math.round(Number(e.cantidad) * 100) / 100,
  };

  if (ORIGENES.indexOf(datos.origen) === -1) return { error: 'Elige si el ingreso es una compra o una donación.' };
  if (!datos.andamio) return { error: 'Indica en qué andamio se guarda.' };
  if (!datos.articulo) return { error: 'Escribe el nombre del artículo.' };
  if (!isFinite(datos.cantidad) || datos.cantidad <= 0 || datos.cantidad > 100000) {
    return { error: 'La cantidad debe ser un número mayor que 0.' };
  }

  let finDeMes = null;
  if (datos.vencimiento) {
    const m = datos.vencimiento.match(/^([a-z]{3})-(\d{2})$/);
    const mes = m ? MESES_ABREVIADOS.indexOf(m[1]) : -1;
    if (mes === -1) return { error: 'La fecha de expiración debe verse así: sep-27.' };
    finDeMes = new Date(2000 + Number(m[2]), mes + 1, 0);
  }

  // Los insumos médicos deben traer fecha y estar vigentes (aviso de la página de donaciones).
  const esMedico = /medic|primeros auxilios/.test(normalizarTexto_(datos.categoria + ' ' + datos.andamio));
  if (esMedico && !finDeMes) return { error: 'Los insumos médicos necesitan fecha de expiración.' };
  if (finDeMes && finDeMes < new Date()) return { error: 'El lote ya está vencido: no se registra como ingreso.' };

  return { datos: datos };
}

// Devuelve el índice de la primera columna cuyo nombre cumple la condición (-1 si ninguna).
function buscarColumna_(encabezados, condicion) {
  for (let i = 0; i < encabezados.length; i++) {
    if (condicion(normalizarTexto_(encabezados[i]))) return i;
  }
  return -1;
}

function registrarIngreso(entrada) {
  const usuario = Session.getActiveUser().getEmail();

  const validacion = validarIngreso_(entrada);
  if (validacion.error) return { ok: false, motivo: 'datos', detalle: validacion.error, usuario: usuario };
  const d = validacion.datos;

  // Un solo registro a la vez, para que dos personas no se pisen la misma fila.
  const candado = LockService.getScriptLock();
  try {
    candado.waitLock(15000);
  } catch (error) {
    return { ok: false, motivo: 'ocupado', detalle: 'Hay otro registro en curso. Inténtalo de nuevo en unos segundos.', usuario: usuario };
  }

  try {
    const libro = Sheets.Spreadsheets.get(HOJA_ID, { fields: 'sheets.properties' });
    const propiedades = libro.sheets.map(function (h) { return h.properties; });
    const pestana = PESTANA ? propiedades.filter(function (p) { return p.title === PESTANA; })[0] : propiedades[0];
    if (!pestana) return { ok: false, motivo: 'error', detalle: 'No se encontró la pestaña de inventario.', usuario: usuario };

    const rango = citarPestana_(pestana.title);
    const valores = Sheets.Spreadsheets.Values.get(HOJA_ID, rango).values || [];
    const encabezados = (valores[0] || []).slice();
    if (!encabezados.length) return { ok: false, motivo: 'error', detalle: 'La hoja no tiene encabezados.', usuario: usuario };

    const col = {
      andamio: buscarColumna_(encabezados, function (n) { return n.indexOf('andamio') === 0 || n.indexOf('ubicacion') === 0; }),
      categoria: buscarColumna_(encabezados, function (n) { return n.indexOf('categoria') === 0; }),
      articulo: buscarColumna_(encabezados, function (n) { return n.indexOf('articulo') === 0 || n.indexOf('insumo') === 0 || n.indexOf('producto') === 0; }),
      unidad: buscarColumna_(encabezados, function (n) { return n.indexOf('unidad') === 0; }),
      contenido: buscarColumna_(encabezados, function (n) { return n.indexOf('contenido') === 0; }),
      cantidad: buscarColumna_(encabezados, function (n) { return (n.indexOf('cantidad') === 0 && n.indexOf('minim') === -1) || n === 'stock'; }),
      vencimiento: buscarColumna_(encabezados, function (n) { return n.indexOf('expir') !== -1 || n.indexOf('venc') !== -1; }),
      talla: buscarColumna_(encabezados, function (n) { return n.indexOf('talla') === 0; }),
      origen: buscarColumna_(encabezados, function (n) { return n === 'origen'; }),
      ingreso: buscarColumna_(encabezados, function (n) { return n.indexOf('fecha de ingreso') === 0; }),
      registrado: buscarColumna_(encabezados, function (n) { return n.indexOf('registrado') === 0; }),
    };
    if (col.andamio === -1 || col.articulo === -1 || col.cantidad === -1) {
      return { ok: false, motivo: 'error', detalle: 'La hoja debe tener las columnas "Andamio", "Artículo" y "Cantidad".', usuario: usuario };
    }

    // Agrega al final de los encabezados las columnas de seguimiento que falten.
    let encabezadosCambiaron = false;
    ['origen', 'ingreso', 'registrado'].forEach(function (clave, i) {
      if (col[clave] === -1) {
        encabezados.push(COLUMNAS_EXTRA[i]);
        col[clave] = encabezados.length - 1;
        encabezadosCambiaron = true;
      }
    });

    // Amplía la cuadrícula si hace falta.
    const filaNueva = valores.length + 1;
    const solicitudes = [];
    if (filaNueva > pestana.gridProperties.rowCount) {
      solicitudes.push({ appendDimension: { sheetId: pestana.sheetId, dimension: 'ROWS', length: 50 } });
    }
    if (encabezados.length > pestana.gridProperties.columnCount) {
      solicitudes.push({
        appendDimension: {
          sheetId: pestana.sheetId,
          dimension: 'COLUMNS',
          length: encabezados.length - pestana.gridProperties.columnCount,
        },
      });
    }
    if (solicitudes.length) Sheets.Spreadsheets.batchUpdate({ requests: solicitudes }, HOJA_ID);
    if (encabezadosCambiaron) {
      Sheets.Spreadsheets.Values.update({ values: [encabezados] }, HOJA_ID, rango + '!A1', { valueInputOption: 'RAW' });
    }

    // ¿Ya existe una fila igual? Entonces se suma a ella.
    const celda = function (fila, indice) { return indice === -1 ? '' : paraComparar_(fila[indice]); };
    let filaExistente = -1;
    for (let i = 1; i < valores.length; i++) {
      const fila = valores[i];
      if (
        celda(fila, col.andamio) === paraComparar_(d.andamio) &&
        celda(fila, col.articulo) === paraComparar_(d.articulo) &&
        celda(fila, col.unidad) === paraComparar_(d.unidad) &&
        celda(fila, col.contenido) === paraComparar_(d.contenido) &&
        celda(fila, col.talla) === paraComparar_(d.talla) &&
        celda(fila, col.vencimiento) === paraComparar_(d.vencimiento)
      ) {
        filaExistente = i + 1; // número de fila en la hoja (1 = encabezados)
        break;
      }
    }

    const fecha = Utilities.formatDate(new Date(), 'America/Lima', 'yyyy-MM-dd');
    let resultado;
    let total;

    if (filaExistente !== -1) {
      const direccion = rango + '!' + letraColumna_(col.cantidad) + filaExistente;
      const actual = Sheets.Spreadsheets.Values.get(HOJA_ID, direccion, { valueRenderOption: 'UNFORMATTED_VALUE' }).values;
      const anterior = actual && actual[0] && Number(actual[0][0]) ? Number(actual[0][0]) : 0;
      total = Math.round((anterior + d.cantidad) * 100) / 100;
      Sheets.Spreadsheets.Values.update({ values: [[total]] }, HOJA_ID, direccion, { valueInputOption: 'RAW' });
      resultado = 'Sumado a la fila ' + filaExistente;
    } else {
      const fila = [];
      for (let i = 0; i < encabezados.length; i++) fila.push('');
      const poner = function (indice, valor) { if (indice !== -1) fila[indice] = valor; };
      poner(col.andamio, d.andamio);
      poner(col.categoria, d.categoria);
      poner(col.articulo, d.articulo);
      poner(col.unidad, d.unidad);
      poner(col.contenido, d.contenido);
      poner(col.cantidad, d.cantidad);
      poner(col.vencimiento, d.vencimiento || '-');
      poner(col.talla, d.talla || '-');
      poner(col.origen, d.origen);
      poner(col.ingreso, fecha);
      poner(col.registrado, usuario);
      // RAW: el texto se guarda tal cual, así que nada de lo escrito se interpreta como fórmula.
      Sheets.Spreadsheets.Values.update({ values: [fila] }, HOJA_ID, rango + '!A' + filaNueva, { valueInputOption: 'RAW' });
      total = d.cantidad;
      resultado = 'Fila nueva (' + filaNueva + ')';
    }

    anotarHistorial_(propiedades, usuario, d, resultado);

    return { ok: true, usuario: usuario, accion: filaExistente !== -1 ? 'suma' : 'nuevo', total: total };
  } catch (error) {
    const mensaje = String(error && error.message || error);
    if (/permission|forbidden|403|caller does not have/i.test(mensaje)) {
      return { ok: false, motivo: 'sin-permiso-edicion', usuario: usuario };
    }
    console.error(mensaje);
    return { ok: false, motivo: 'error', detalle: mensaje, usuario: usuario };
  } finally {
    candado.releaseLock();
  }
}

// Anota el ingreso en la pestaña de historial (la crea la primera vez).
function anotarHistorial_(propiedades, usuario, d, resultado) {
  const rango = citarPestana_(HOJA_HISTORIAL);
  const existe = propiedades.some(function (p) { return p.title === HOJA_HISTORIAL; });
  if (!existe) {
    Sheets.Spreadsheets.batchUpdate({ requests: [{ addSheet: { properties: { title: HOJA_HISTORIAL } } }] }, HOJA_ID);
    Sheets.Spreadsheets.Values.update({ values: [ENCABEZADOS_HISTORIAL] }, HOJA_ID, rango + '!A1', { valueInputOption: 'RAW' });
  }
  const marca = Utilities.formatDate(new Date(), 'America/Lima', 'yyyy-MM-dd HH:mm');
  const fila = [
    marca, usuario, d.origen, d.andamio, d.categoria, d.articulo, d.unidad, d.contenido,
    d.talla, d.cantidad, d.vencimiento, d.contraparte, d.nota, resultado,
  ];
  Sheets.Spreadsheets.Values.append(
    { values: [fila] }, HOJA_ID, rango + '!A1',
    { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' }
  );
}
