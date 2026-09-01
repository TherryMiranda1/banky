import type { Building } from "@/lib/api/kingdom";

export const TREASURY_KEY = "incomes";
export const GROUND_KEY = "ground";

export function getSpriteKey(building?: Building | null): string {
  if (!building || !building.categoryName) {
    return "home";
  }

  const name = building.categoryName.toLowerCase();

  // 1. Nómina / Ingresos
  if (
    name.includes("nómina") ||
    name.includes("nomina") ||
    name.includes("ingreso") ||
    name.includes("income")
  ) {
    return "incomes";
  }

  // 2. Ahorro / Inversión
  if (
    name.includes("ahorro") ||
    name.includes("saving") ||
    name.includes("inversión") ||
    name.includes("inversion")
  ) {
    return "savings";
  }

  // 3. Compras / Ropa / Shopping / Despensa / Mantenimiento
  if (
    name.includes("compra") ||
    name.includes("ropa") ||
    name.includes("shopping") ||
    name.includes("despensa") ||
    name.includes("cosas de casa") ||
    name.includes("mantenimiento") ||
    name.includes("storehouse")
  ) {
    return "storehouse";
  }

  // 4. Restaurantes / Cafés / Bares / Ocio
  if (
    name.includes("restaurante") ||
    name.includes("café") ||
    name.includes("cafe") ||
    name.includes("bar") ||
    name.includes("ocio") ||
    name.includes("entretenimiento") ||
    name.includes("hobbie") ||
    name.includes("hobby") ||
    name.includes("leisure")
  ) {
    return "leisure";
  }

  // 5. Alimentación / Comida / Supermercado
  if (
    name.includes("alimentación") ||
    name.includes("alimentacion") ||
    name.includes("comida") ||
    name.includes("supermercado") ||
    name.includes("super") ||
    name.includes("food")
  ) {
    return "food";
  }

  // 6. Vivienda / Hogar / Alquiler / Hipoteca
  if (
    name.includes("vivienda") ||
    name.includes("hogar") ||
    name.includes("alquiler") ||
    name.includes("hipoteca") ||
    name.includes("home")
  ) {
    return "home";
  }

  // 7. Transporte / Combustible / Viajes
  if (
    name.includes("transporte") ||
    name.includes("combustible") ||
    name.includes("viaje") ||
    name.includes("transport")
  ) {
    return "transport";
  }

  // 8. Salud / Farmacia / Médico
  if (
    name.includes("salud") ||
    name.includes("farmacia") ||
    name.includes("médico") ||
    name.includes("medico") ||
    name.includes("healt") ||
    name.includes("health")
  ) {
    return "healt";
  }

  // 9. Seguros / Seguro
  if (name.includes("seguro") || name.includes("insurance")) {
    return "insurance";
  }

  // 10. Suscripciones / Servicios / Streaming
  if (
    name.includes("suscripci") ||
    name.includes("servicio") ||
    name.includes("streaming") ||
    name.includes("subscription")
  ) {
    return "subscriptions";
  }

  // 11. Deuda / Préstamo / Tarjeta
  if (
    name.includes("deuda") ||
    name.includes("préstamo") ||
    name.includes("prestamo") ||
    name.includes("tarjeta") ||
    name.includes("debt")
  ) {
    return "debt";
  }

  // 12. Imprevisto / Inesperado / Multas
  if (
    name.includes("imprevisto") ||
    name.includes("inesperado") ||
    name.includes("multa") ||
    name.includes("unexpected")
  ) {
    return "unexpected";
  }

  return "home";
}
