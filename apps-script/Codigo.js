/**
 * Panel interno de inventario – Bomberos en Orden
 *
 * Web app de Google Apps Script. Se ejecuta con la cuenta de Google de quien
 * la abre, así que solo ven el inventario las personas con quienes se
 * compartió la hoja. Para dar o quitar acceso: Compartir en la hoja.
 */

// ID de la hoja de inventario (la parte entre /d/ y /edit en su enlace).
const HOJA_ID = '1Us93v_aQwXsa0F3trvZh6gH-F6nhumJ9t8QB-hA2yZc';

// Nombre de la pestaña con el inventario. Vacío = la primera pestaña.
const PESTANA = '';

function doGet() {
  return HtmlService.createTemplateFromFile('Panel')
    .evaluate()
    .setTitle('Panel de inventario – Bomberos en Orden')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Inserta el contenido de otro archivo HTML del proyecto (estilos y script).
function incluir(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

// La llama el panel cada minuto. Devuelve las filas tal como se ven en la hoja.
// Usa la API de Google Sheets (servicio avanzado "Sheets") porque permite leer
// con permiso de solo lectura: el panel nunca puede modificar la hoja.
function obtenerInventario() {
  const usuario = Session.getActiveUser().getEmail();

  try {
    let pestana = PESTANA;
    if (!pestana) {
      const libro = Sheets.Spreadsheets.get(HOJA_ID, { fields: 'sheets.properties.title' });
      pestana = libro.sheets[0].properties.title;
    }
    // Los valores llegan con el formato que se ve en la hoja (ej. "sep-27").
    const rango = Sheets.Spreadsheets.Values.get(HOJA_ID, `'${pestana.replace(/'/g, "''")}'`);
    return { ok: true, usuario: usuario, filas: rango.values || [] };
  } catch (error) {
    const mensaje = String(error && error.message || error);
    // Google responde "sin permiso" o "no encontrado" cuando la hoja no está compartida con esta cuenta.
    if (/permission|not found|403|404/i.test(mensaje)) {
      return { ok: false, motivo: 'sin-acceso', usuario: usuario };
    }
    console.error(mensaje);
    return { ok: false, motivo: 'error', detalle: mensaje, usuario: usuario };
  }
}
