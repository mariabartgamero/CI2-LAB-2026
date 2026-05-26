import { apiRequest } from "./api.js";

export function getUser(userId) {
    return apiRequest(`/api/users/${userId}`);
}
