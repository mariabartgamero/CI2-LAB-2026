package com.ci2lab.carsharing.dto;

import jakarta.validation.constraints.NotBlank;

public record CompanyRequest(
        @NotBlank String name,
        String domain,
        String address,
        Double latitude,
        Double longitude
) {
}
