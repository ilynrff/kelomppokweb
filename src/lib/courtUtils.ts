/**
 * Normalizes the images field from the database to ensure it's always
 * an array of objects with the required structure.
 */
export function normalizeImages(images: any): { url: string; isDefault: boolean; isActive: boolean }[] {
  if (!images) return [];

  // Handle legacy string (single image)
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return normalizeImages(parsed);
    } catch {
      return [{ url: images, isDefault: true, isActive: true }];
    }
  }

  // If not an array, return empty
  if (!Array.isArray(images)) return [];

  return images.map((img: any) => {
    if (typeof img === "string") {
      return { url: img, isDefault: true, isActive: true };
    }

    return {
      url: img?.url || "",
      isDefault: img?.isDefault ?? false,
      isActive: img?.isActive !== undefined ? !!img.isActive : true,
    };
  }).filter(img => !!img.url);
}
