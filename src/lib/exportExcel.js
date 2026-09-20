import * as XLSX from 'xlsx';

/** Downloads `rows` (array of flat objects) as a .xlsx file named `filename`. */
export function downloadAsExcel(rows, filename, sheetName = 'Sheet1') {
  const data = Array.isArray(rows) && rows.length > 0 ? rows : [{}];
  const sheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
