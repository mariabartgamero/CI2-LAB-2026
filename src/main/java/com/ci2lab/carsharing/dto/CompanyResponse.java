package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.Company;

public record CompanyResponse(
        Long id,
        String name,
        String domain,
        String address,
        Double latitude,
        Double longitude
) {
    public static CompanyResponse from(Company company) {
        return new CompanyResponse(
                company.getId(),
                company.getName(),
                company.getDomain(),
                company.getAddress(),
                company.getLatitude(),
                company.getLongitude()
        );
    }
}
