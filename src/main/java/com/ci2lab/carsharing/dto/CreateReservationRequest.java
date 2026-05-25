package com.ci2lab.carsharing.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateReservationRequest(
        @NotNull Long userId,
        @NotNull Long carId,
        @NotNull Long officeId,
        @NotNull LocalDateTime horaSalida
) {
}
