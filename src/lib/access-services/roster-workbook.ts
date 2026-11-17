import "server-only";
import * as XLSX from "xlsx";

/** One-sheet .xlsx with readable column widths and a frozen header row. */
export function rosterWorkbook(rows: string[][]): Buffer {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = (rows[0] ?? []).map((_, col) => ({
    wch: Math.min(
      70,
      Math.max(14, ...rows.map((row) => (row[col] ?? "").length + 2)),
    ),
  }));
  sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Services");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function xlsxResponseHeaders(fileName: string): HeadersInit {
  return {
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "private, no-store",
  };
}
