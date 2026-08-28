import { Transaction } from "./api/transactions";

function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r") || str.includes(",")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTransactionsToExcel(
  transactions: Transaction[],
  fileName = "banky-transacciones"
): void {
  if (!transactions || transactions.length === 0) {
    alert("No hay transacciones disponibles para exportar con los filtros seleccionados.");
    return;
  }

  const headers = [
    "Fecha",
    "Descripción",
    "Cuenta / Banco",
    "IBAN",
    "Categoría",
    "Tipo de Movimiento",
    "Importe",
    "Moneda",
    "ID Transacción"
  ];

  const rows = transactions.map((tx) => {
    const amtNum = parseFloat(tx.amount);
    let typeLabel = "Gasto";
    if (tx.isTransfer || tx.category?.toLowerCase() === "traspasos" || tx.category?.toLowerCase() === "traspaso") {
      typeLabel = "Traspaso Interno";
    } else if (amtNum > 0) {
      typeLabel = "Ingreso";
    }

    const dateStr = tx.bookedAt ? tx.bookedAt.split("T")[0] : "";
    const accountLabel = tx.accountAlias || tx.bankName || "Cuenta";
    const ibanStr = tx.iban || "";
    const categoryStr = tx.category || "Sin categoría";
    const amountStr = !isNaN(amtNum) ? amtNum.toFixed(2).replace(".", ",") : tx.amount;

    return [
      escapeCsvField(dateStr),
      escapeCsvField(tx.description || "Sin concepto"),
      escapeCsvField(accountLabel),
      escapeCsvField(ibanStr),
      escapeCsvField(categoryStr),
      escapeCsvField(typeLabel),
      escapeCsvField(amountStr),
      escapeCsvField(tx.currency || "EUR"),
      escapeCsvField(tx.id)
    ].join(";");
  });

  // UTF-8 BOM so Excel opens accents and special characters without encoding errors
  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const now = new Date().toISOString().split("T")[0];

  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}-${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
