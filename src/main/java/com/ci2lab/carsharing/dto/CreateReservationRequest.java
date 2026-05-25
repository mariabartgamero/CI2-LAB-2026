package com.ci2lab.carsharing.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateReservationRequest(
        @NotNull Long carId,
        @NotNull Double originLatitude,
        @NotNull Double originLongitude,
        @NotBlank String destination,
        @NotNull @Future LocalDateTime startTime,
        @NotNull @Future LocalDateTime endTime
) {
}
