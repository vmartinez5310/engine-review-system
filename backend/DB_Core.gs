function getSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Hoja no encontrada: ' + name);
  return sheet;
}

function db_crearFila(nombreHoja, arrayDatos) {
  const sheet = getSheet(nombreHoja);
  const colA = sheet.getRange('A:A').getValues();
  let fila = colA.findIndex(c => String(c[0]).trim() === '') + 1;
  if (fila === 0) fila = sheet.getLastRow() + 1;

  const range = sheet.getRange(fila, 1, 1, arrayDatos.length);
  range.setValues([arrayDatos]);

  if (fila > 2) {
    sheet.getRange(fila - 1, 1, 1, arrayDatos.length)
      .copyTo(range, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  }
  return fila;
}

function db_leerTodo(nombreHoja) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombreHoja);
  if (!sheet) return [];

  const data = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) return [];

  const headers = data.shift().map(h => String(h).trim());
  return data
    .map((row, i) => {
      const obj = { _fila: i + 2 };
      headers.forEach((h, j) => { if (h) obj[h] = row[j]; });
      return obj;
    })
    .filter(r => r[headers[0]] !== '');
}

function db_actualizarCampos(nombreHoja, fila, updates) {
  const sheet = getSheet(nombreHoja);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(h => String(h).trim());

  Object.entries(updates).forEach(([col, val]) => {
    const idx = headers.indexOf(col) + 1;
    if (idx > 0) sheet.getRange(fila, idx).setValue(val);
  });
  return true;
}
