export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const h =
    Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function withinRadius(distance: number, radius: 5 | 7.5 | 10) {
  return Number.isFinite(distance) && distance >= 0 && distance <= radius;
}
export function canRespondToConnection(
  request: { recipient_id: string; status: string },
  actor: string,
) {
  return request.recipient_id === actor && request.status === "pending";
}
