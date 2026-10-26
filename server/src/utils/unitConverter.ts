/**
 * Unit conversion and compatibility utility for pantry and grocery items.
 * Strictly adheres to safe, compatible conversions without guessing.
 */

// Normalized unit aliases
const MASS_UNITS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilo: 1000,
  kilos: 1000,
  kilogram: 1000,
  kilograms: 1000,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
};

const VOLUME_UNITS: Record<string, number> = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  litre: 1000,
  litres: 1000,
  cup: 240,
  cups: 240,
  tbsp: 15,
  tablespoon: 15,
  tablespoons: 15,
  tsp: 5,
  teaspoon: 5,
  teaspoons: 5,
  fl_oz: 29.5735,
};

const COUNT_UNITS = new Set([
  'piece',
  'pieces',
  'item',
  'items',
  'can',
  'cans',
  'jar',
  'jars',
  'bottle',
  'bottles',
  'pack',
  'packs',
  'head',
  'heads',
  'clove',
  'cloves',
  'stalk',
  'stalks',
  'fillet',
  'fillets',
  'slice',
  'slices',
  'bunch',
  'bunches',
]);

export class UnitConverter {
  /**
   * Normalizes a unit string to canonical form
   */
  public static normalizeUnit(unit?: string): string {
    if (!unit) return '';
    const clean = unit.toLowerCase().trim().replace(/s$/, ''); // simple singularization
    if (clean === 'gram') return 'g';
    if (clean === 'kilo' || clean === 'kilogram') return 'kg';
    if (clean === 'milliliter') return 'ml';
    if (clean === 'liter' || clean === 'litre') return 'l';
    if (clean === 'tablespoon') return 'tbsp';
    if (clean === 'teaspoon') return 'tsp';
    return unit.toLowerCase().trim();
  }

  /**
   * Checks if two units belong to the same dimension and can be converted safely
   */
  public static areCompatible(unitA?: string, unitB?: string): boolean {
    const normA = (unitA || '').toLowerCase().trim();
    const normB = (unitB || '').toLowerCase().trim();

    if (normA === normB) return true;

    // Both mass
    if (normA in MASS_UNITS && normB in MASS_UNITS) return true;

    // Both volume
    if (normA in VOLUME_UNITS && normB in VOLUME_UNITS) return true;

    // Count units must match exactly
    const singA = normA.replace(/s$/, '');
    const singB = normB.replace(/s$/, '');
    if (COUNT_UNITS.has(singA) && singA === singB) return true;

    return false;
  }

  /**
   * Converts a quantity from sourceUnit to targetUnit.
   * Returns null if units are incompatible or ambiguous (e.g. grams vs pieces).
   */
  public static convert(
    quantity: number,
    fromUnit?: string,
    toUnit?: string
  ): number | null {
    const normFrom = (fromUnit || '').toLowerCase().trim();
    const normTo = (toUnit || '').toLowerCase().trim();

    if (normFrom === normTo) return quantity;

    // Mass conversion
    if (normFrom in MASS_UNITS && normTo in MASS_UNITS) {
      const inGrams = quantity * MASS_UNITS[normFrom];
      const result = inGrams / MASS_UNITS[normTo];
      return Math.round(result * 1000) / 1000;
    }

    // Volume conversion
    if (normFrom in VOLUME_UNITS && normTo in VOLUME_UNITS) {
      const inMl = quantity * VOLUME_UNITS[normFrom];
      const result = inMl / VOLUME_UNITS[normTo];
      return Math.round(result * 1000) / 1000;
    }

    // Identical singular count
    if (normFrom.replace(/s$/, '') === normTo.replace(/s$/, '')) {
      return quantity;
    }

    // Incompatible / ambiguous
    return null;
  }
}
