
export function slugify(input : string) {
    const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`
}

// Slug for URL combines the slug plus random suffix 