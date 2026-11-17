/**
 * A reference the server returns as the ID of the referenced entity, or, when it expands the reference, as an object
 * with the fields the request asked for. A string has none of the object's fields, so it reads as an empty object: the
 * same fields are undefined as before.
 */
export function asReference<T extends object>(value: string | T | null | undefined): Partial<T> {
  return value && typeof value === 'object' ? value : {};
}

/** The ID of a reference (see asReference), or undefined when there is none. */
export function referenceId(value: string | {id?: string} | null | undefined): string | undefined {
  return asReference<{id?: string}>(value).id;
}
