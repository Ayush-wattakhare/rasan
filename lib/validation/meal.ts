/**
 * Validation for meal create (POST /api/meals) and edit (PATCH /api/meals/[id]).
 * Unknown fields are dropped; every kept field has the type the database expects.
 */

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

type Result = { values: Record<string, unknown> } | { error: string };

function stringList(value: unknown, maxItems: number, maxLen: number): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((v) => typeof v === 'string')) return null;
  return value.map((v: string) => v.trim().slice(0, maxLen)).filter(Boolean).slice(0, maxItems);
}

/**
 * @param partial true for PATCH (only provided fields are validated/returned),
 *                false for POST (required fields must be present).
 */
export function validateMealInput(body: unknown, partial: boolean): Result {
  if (!body || typeof body !== 'object') return { error: 'Invalid request body' };
  const b = body as Record<string, unknown>;
  const values: Record<string, unknown> = {};
  const has = (k: string) => b[k] !== undefined;

  if (!partial) {
    for (const k of ['name', 'category', 'meal_type', 'price', 'preparation_time']) {
      if (b[k] === undefined || b[k] === null || b[k] === '') return { error: 'Missing required fields' };
    }
  }

  if (has('name')) {
    if (typeof b.name !== 'string' || !b.name.trim()) return { error: 'Name is required' };
    values.name = b.name.trim().slice(0, 120);
  }
  if (has('description')) {
    if (b.description !== null && typeof b.description !== 'string') return { error: 'Invalid description' };
    values.description = b.description ? String(b.description).trim().slice(0, 1000) : null;
  }
  if (has('category')) {
    if (typeof b.category !== 'string' || !b.category.trim()) return { error: 'Invalid category' };
    values.category = b.category.trim().slice(0, 50);
  }
  if (has('meal_type')) {
    if (!(MEAL_TYPES as readonly unknown[]).includes(b.meal_type)) return { error: 'Invalid meal type' };
    values.meal_type = b.meal_type;
  }
  if (has('price')) {
    const n = Number(b.price);
    if (!Number.isFinite(n) || n <= 0 || n > 100000) return { error: 'Price must be greater than 0' };
    values.price = Math.round(n * 100) / 100;
  }
  if (has('discount_price')) {
    if (b.discount_price === null || b.discount_price === '') {
      values.discount_price = null;
    } else {
      const n = Number(b.discount_price);
      if (!Number.isFinite(n) || n <= 0) return { error: 'Invalid discount price' };
      values.discount_price = Math.round(n * 100) / 100;
    }
  }
  if (has('preparation_time')) {
    const n = Number(b.preparation_time);
    if (!Number.isInteger(n) || n <= 0 || n > 600) return { error: 'Preparation time must be 1-600 minutes' };
    values.preparation_time = n;
  }
  if (has('stock')) {
    if (b.stock === null || b.stock === '') {
      values.stock = null;
    } else {
      const n = Number(b.stock);
      if (!Number.isInteger(n) || n < 0 || n > 100000) return { error: 'Stock must be a whole number' };
      values.stock = n;
    }
  }
  for (const flag of ['is_veg', 'is_available'] as const) {
    if (has(flag)) {
      if (typeof b[flag] !== 'boolean') return { error: `${flag} must be true or false` };
      values[flag] = b[flag];
    }
  }
  for (const list of ['ingredients', 'allergens'] as const) {
    if (has(list)) {
      const parsed = b[list] === null ? [] : stringList(b[list], 50, 60);
      if (!parsed) return { error: `Invalid ${list}` };
      values[list] = parsed;
    }
  }
  if (has('image_url')) {
    if (b.image_url !== null && (typeof b.image_url !== 'string' || !/^https:\/\//.test(b.image_url))) {
      return { error: 'Invalid image URL' };
    }
    values.image_url = b.image_url ? String(b.image_url).slice(0, 1000) : null;
  }
  if (has('nutritional_info')) {
    if (b.nutritional_info !== null && (typeof b.nutritional_info !== 'object' || Array.isArray(b.nutritional_info))) {
      return { error: 'Invalid nutritional info' };
    }
    values.nutritional_info = b.nutritional_info;
  }

  if (partial && Object.keys(values).length === 0) return { error: 'No editable fields provided' };
  return { values };
}

/** A discount price must be below the price it discounts. */
export function checkDiscount(price: unknown, discount: unknown): string | null {
  if (discount == null) return null;
  return Number(discount) < Number(price) ? null : 'Discount price must be lower than the price';
}
