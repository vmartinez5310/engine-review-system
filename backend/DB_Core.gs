function getSheet(sheetName) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
}

function db_crearFila(nombreHoja, arrayDatos) {
  const sheet = getSheet(nombreHoja);
  if (!sheet) throw new Error("Hoja no encontrada: " + nombreHoja);
  const valoresColA = sheet.getRange("A:A").getValues();
  let filaVacia = valoresColA.findIndex(celda => String(celda[0]).trim() === "") + 1;
  
  if (filaVacia === 0) filaVacia = sheet.getLastRow() + 1;
  const targetRange = sheet.getRange(filaVacia, 1, 1, arrayDatos.length);
  targetRange.setValues([arrayDatos]);
  
  if (filaVacia > 2) {
    const sourceRange = sheet.getRange(filaVacia - 1, 1, 1, arrayDatos.length);
    sourceRange.copyTo(targetRange, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  }
  return filaVacia;
}

function db_leerTodo(nombreHoja) {
  const sheet = getSheet(nombreHoja);
  if (!sheet) return [];
  const data = sheet.getDataRange().getDisplayValues();
  const headers = data.shift(); 
  
  return data.map((row, index) => {
    let obj = { _fila: index + 2 };  
    headers.forEach((header, i) => { if(header) obj[header.trim()] = row[i]; });
    return obj;
  }).filter(r => r[headers[0]] !== ''); 
}

function db_actualizarCampos(nombreHoja, numeroFila, objetoActualizaciones) {
  const sheet = getSheet(nombreHoja);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  
  for (const [columnaNombre, valor] of Object.entries(objetoActualizaciones)) {
    const colIndex = headers.indexOf(columnaNombre) + 1;
    if (colIndex > 0) sheet.getRange(numeroFila, colIndex).setValue(valor);
  }
  return true;
}