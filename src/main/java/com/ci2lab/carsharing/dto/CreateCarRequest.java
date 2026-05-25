package com.ci2lab.carsharing.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCarRequest(
        @NotBlank String brand,
        @NotBlank String model,
        @NotBlank String licensePlate,
        @Min(1) int capacity,
        @NotNull Double latitude,
        @NotNull Double longitude
) {
}
