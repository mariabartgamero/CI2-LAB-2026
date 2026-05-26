export const COMPANY_LOCATION = {
    lat: 40.6009,
    lng: -3.7080,
    name: "Oficina Tres Cantos"
};

const AVERAGE_SPEED_KMH = 40;

export function distanceKm(from, to = COMPANY_LOCATION) {
    const earthRadiusKm = 6371;
    const dLat = toRadians(to.lat - from.lat);
    const dLng = toRadians(to.lng - from.lng);
    const lat1 = toRadians(from.lat);
    const lat2 = toRadians(to.lat);

    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimatedMinutes(distance) {
    return Math.max(1, Math.round((distance / AVERAGE_SPEED_KMH) * 60));
}

export function responsiblePoints(distance) {
    return Math.round(distance * 10);
}

export function officeLocation(office) {
    return {
        lat: office.latitud,
        lng: office.longitud,
        name: office.nombre
    };
}

export function tripMetrics(car, office = COMPANY_LOCATION) {
    const destination = office.latitud ? officeLocation(office) : office;
    const distance = distanceKm({ lat: car.latitud, lng: car.longitud }, destination);
    return {
        distance,
        distanceLabel: `${distance.toFixed(1)} km`,
        minutes: estimatedMinutes(distance),
        points: responsiblePoints(distance),
        autonomyKm: Math.round(car.bateria * 4.3),
        destination
    };
}

function toRadians(value) {
    return value * Math.PI / 180;
}
