export interface MccInfo {
  code: string;
  name: string;
  group: string;
  icon: string;
}

export const MCC_DICTIONARY: Record<string, MccInfo> = {
  "5411": { code: "5411", name: "Supermercados & Alimentación", group: "Alimentación", icon: "ShoppingCart" },
  "5499": { code: "5499", name: "Tiendas de Alimentación de Conveniencia", group: "Alimentación", icon: "Store" },
  "5422": { code: "5422", name: "Carnicerías & Pescaderías", group: "Alimentación", icon: "Utensils" },
  "5441": { code: "5441", name: "Confiterías & Pastelerías", group: "Alimentación", icon: "Coffee" },
  "5462": { code: "5462", name: "Panaderías", group: "Alimentación", icon: "Coffee" },
  "5812": { code: "5812", name: "Restaurantes & Bares", group: "Restauración", icon: "Utensils" },
  "5813": { code: "5813", name: "Bares, Pubs & Discotecas", group: "Ocio", icon: "GlassWater" },
  "5814": { code: "5814", name: "Comida Rápida", group: "Restauración", icon: "Utensils" },
  "5541": { code: "5541", name: "Gasolineras & Combustible", group: "Transporte", icon: "Fuel" },
  "5542": { code: "5542", name: "Gasolineras Automáticas", group: "Transporte", icon: "Fuel" },
  "4121": { code: "4121", name: "Taxis & VTC (Uber/Cabify)", group: "Transporte", icon: "Car" },
  "4111": { code: "4111", name: "Transporte Público (Metro/Tren)", group: "Transporte", icon: "Train" },
  "4112": { code: "4112", name: "Ferrocarriles de Pasajeros", group: "Transporte", icon: "Train" },
  "4131": { code: "4131", name: "Líneas de Autobuses", group: "Transporte", icon: "Bus" },
  "4511": { code: "4511", name: "Aerolíneas & Vuelos", group: "Viajes", icon: "Plane" },
  "7011": { code: "7011", name: "Hoteles & Alojamientos", group: "Viajes", icon: "Hotel" },
  "7512": { code: "7512", name: "Alquiler de Vehículos", group: "Transporte", icon: "Car" },
  "4722": { code: "4722", name: "Agencias de Viajes", group: "Viajes", icon: "MapPin" },
  "4899": { code: "4899", name: "Streaming & TV por Cable", group: "Suscripciones", icon: "Tv" },
  "4814": { code: "4814", name: "Telecomunicaciones & Telefonía", group: "Hogar", icon: "Phone" },
  "4900": { code: "4900", name: "Servicios Públicos (Luz, Gas, Agua)", group: "Hogar", icon: "Zap" },
  "5732": { code: "5732", name: "Electrónica & Software", group: "Tecnología", icon: "Laptop" },
  "5818": { code: "5818", name: "Bienes Digitales & Medios", group: "Tecnología", icon: "Globe" },
  "5912": { code: "5912", name: "Farmacias & Parafarmacias", group: "Salud", icon: "HeartPulse" },
  "8011": { code: "8011", name: "Médicos & Clínicas", group: "Salud", icon: "Activity" },
  "8021": { code: "8021", name: "Dentistas & Odontología", group: "Salud", icon: "Smile" },
  "5651": { code: "5651", name: "Ropa & Moda Familiar", group: "Compras", icon: "ShoppingBag" },
  "5661": { code: "5661", name: "Calzado & Zapatos", group: "Compras", icon: "ShoppingBag" },
  "5311": { code: "5311", name: "Grandes Almacenes (El Corte Inglés)", group: "Compras", icon: "Building" },
  "5942": { code: "5942", name: "Librerías", group: "Cultura", icon: "BookOpen" },
  "7832": { code: "7832", name: "Cines & Espectáculos", group: "Ocio", icon: "Film" },
  "7997": { code: "7997", name: "Gimnasios & Clubes Deportivos", group: "Salud", icon: "Dumbbell" },
  "6011": { code: "6011", name: "Retirada de Efectivo en Cajero", group: "Finanzas", icon: "Banknote" },
  "6012": { code: "6012", name: "Entidades Financieras / Transferencias", group: "Finanzas", icon: "Landmark" },
  "6051": { code: "6051", name: "Criptomonedas / Moneda Extranjera", group: "Finanzas", icon: "Coins" }
};

export function getMccInfo(code: string | null | undefined): MccInfo | null {
  if (!code) return null;
  const clean = code.trim();
  return MCC_DICTIONARY[clean] || {
    code: clean,
    name: `Comercio (MCC ${clean})`,
    group: "General",
    icon: "Store"
  };
}
