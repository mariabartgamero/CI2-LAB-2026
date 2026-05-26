import { apiRequest } from "./api.js";

export function getVisibleCars(userId) {
    return apiRequest(`/api/cars/visible?userId=${userId}`);
}
