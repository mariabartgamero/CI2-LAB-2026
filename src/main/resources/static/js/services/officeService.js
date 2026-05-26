import { apiRequest } from "./api.js";

export function getCompanyOffices(companyId) {
    return apiRequest(`/api/offices/company/${companyId}`);
}
