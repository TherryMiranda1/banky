import type { Building } from "@/lib/api/kingdom";

export const TREASURY_KEY = "incomes";
export const GROUND_KEY = "ground";

export interface RealmSpriteOption {
  key: string;
  name: string;
  categoryHint: string;
  assetPath: string;
}

export const AVAILABLE_REALM_SPRITES: RealmSpriteOption[] = [
  { key: "incomes", name: "Mercado / Tesoro", categoryHint: "Nómina, ingresos, ventas", assetPath: "/assets/incomes.png" },
  { key: "savings", name: "Bóveda Real", categoryHint: "Ahorro, inversiones, depósitos", assetPath: "/assets/savings.png" },
  { key: "food", name: "Granero", categoryHint: "Alimentación, supermercado, víveres", assetPath: "/assets/food.png" },
  { key: "home", name: "Residencia", categoryHint: "Vivienda, alquiler, hipoteca", assetPath: "/assets/home.png" },
  { key: "transport", name: "Establo", categoryHint: "Transporte, combustible, vehículos", assetPath: "/assets/transport.png" },
  { key: "leisure", name: "Taberna", categoryHint: "Ocio, restaurantes, cafés, bares", assetPath: "/assets/leisure.png" },
  { key: "storehouse", name: "Almacén", categoryHint: "Servicios, compras, ropa, hogar", assetPath: "/assets/storehouse.png" },
  { key: "subscriptions", name: "Biblioteca", categoryHint: "Suscripciones, software, streaming", assetPath: "/assets/subscriptions.png" },
  { key: "unexpected", name: "Torre de Guardia", categoryHint: "Imprevistos, emergencias, multas", assetPath: "/assets/unexpected.png" },
  { key: "healt", name: "Botica", categoryHint: "Salud, farmacia, consultas médicas", assetPath: "/assets/healt.png" },
  { key: "insurance", name: "Casa de Guardia", categoryHint: "Seguros y pólizas", assetPath: "/assets/insurance.png" },
  { key: "debt", name: "Mazmorra", categoryHint: "Deudas, préstamos, tarjetas", assetPath: "/assets/debt.png" }
];

export const AVAILABLE_REALM_SPRITE_KEYS = new Set(AVAILABLE_REALM_SPRITES.map((s) => s.key));

export function getSpriteKey(building?: Building | null): string {
  if (!building) {
    return "home";
  }

  // 1. Prioridad: Sprite explícito asignado en la categoría
  if (building.realmSprite && AVAILABLE_REALM_SPRITE_KEYS.has(building.realmSprite)) {
    return building.realmSprite;
  }

  if (!building.categoryName) {
    return "home";
  }

  const name = building.categoryName.toLowerCase();

  // 2. Fallbacks heurísticos por nombre de categoría
  if (
    name.includes("nómina") ||
    name.includes("nomina") ||
    name.includes("ingreso") ||
    name.includes("income")
  ) {
    return "incomes";
  }

  if (
    name.includes("ahorro") ||
    name.includes("saving") ||
    name.includes("inversión") ||
    name.includes("inversion")
  ) {
    return "savings";
  }

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

  if (
    name.includes("vivienda") ||
    name.includes("hogar") ||
    name.includes("alquiler") ||
    name.includes("hipoteca") ||
    name.includes("home")
  ) {
    return "home";
  }

  if (
    name.includes("transporte") ||
    name.includes("combustible") ||
    name.includes("viaje") ||
    name.includes("transport")
  ) {
    return "transport";
  }

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

  if (
    name.includes("compra") ||
    name.includes("ropa") ||
    name.includes("shopping") ||
    name.includes("despensa") ||
    name.includes("cosas de casa") ||
    name.includes("mantenimiento") ||
    name.includes("storehouse") ||
    name.includes("servicio") ||
    name.includes("luz") ||
    name.includes("agua") ||
    name.includes("gas")
  ) {
    return "storehouse";
  }

  if (
    name.includes("suscripci") ||
    name.includes("streaming") ||
    name.includes("subscription")
  ) {
    return "subscriptions";
  }

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

  if (name.includes("seguro") || name.includes("insurance")) {
    return "insurance";
  }

  if (
    name.includes("deuda") ||
    name.includes("préstamo") ||
    name.includes("prestamo") ||
    name.includes("tarjeta") ||
    name.includes("debt")
  ) {
    return "debt";
  }

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
