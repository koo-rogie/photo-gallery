export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | undefined> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
    const data = await res.json();
    return data.address ?? undefined;
  } catch {
    return undefined;
  }
}