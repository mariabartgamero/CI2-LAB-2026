export const COMPANY_LOCATION = {
    lat: 40.6009,
    lng: -3.7080,
    name: "Oficina Tres Cantos"
};

const AVERAGE_SPEED_KMH = 40;
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(address) {
    const query = madridQuery(address);
    if (!query) {
        return { error: "No se encontró esa dirección" };
    }

    const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "1",
        addressdetails: "1",
        countrycodes: "es"
    });

    try {
        const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
            headers: {
                "Accept": "application/json"
            }
        });
        if (!response.ok) {
            return { error: "No se pudo validar la dirección" };
        }

        const results = await response.json();
        const match = results[0];
        if (!match?.lat || !match?.lon) {
            return { error: "No se encontró esa dirección" };
        }

        if (!hasStreetAndNumber(match)) {
            return { error: "Introduce una dirección completa con calle y número" };
        }

        if (!isMadridResult(match)) {
            return { error: "La dirección debe estar en Madrid" };
        }

        return {
            lat: Number(match.lat),
            lng: Number(match.lon),
            name: match.name || query,
            address: match.display_name || query
        };
    } catch (error) {
        return { error: "No se pudo validar la dirección" };
    }
}

function madridQuery(address) {
    const query = String(address || "").trim();
    if (!query) return "";
    return /\bmadrid\b/i.test(query) ? query : `${query}, Madrid, España`;
}

function isMadridResult(result) {
    const address = result.address || {};
    const country = `${address.country_code || ""} ${address.country || ""}`.toLowerCase();
    if (!country.includes("es") && !country.includes("españa") && !country.includes("spain")) {
        return false;
    }

    const madridFields = [
        address.city,
        address.town,
        address.village,
        address.municipality,
        address.county,
        address.state_district,
        address.state,
        result.display_name
    ];
    return madridFields.some((value) => /\bmadrid\b/i.test(String(value || "")));
}

function hasStreetAndNumber(result) {
    const address = result.address || {};
    const street = address.road
        || address.pedestrian
        || address.footway
        || address.cycleway
        || address.path
        || address.residential
        || address.neighbourhood;
    return Boolean(street && address.house_number);
}

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
