const EARTH_RADIUS_KM = 6371;

const toRad = (value) => (value * Math.PI) / 180;

exports.haversine = ({
  lat1,
  lon1,
  lat2,
  lon2
}) => {
  if ([lat1, lon1, lat2, lon2].some((val) => typeof val !== 'number')) {
    return null;
  }
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};
