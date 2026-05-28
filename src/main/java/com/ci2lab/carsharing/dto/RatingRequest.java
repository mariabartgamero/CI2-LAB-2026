package com.ci2lab.carsharing.dto;

import jakarta.validation.constraints.NotNull;

public record RatingRequest(
        @NotNull Long userId,
        @NotNull Integer rating
) {
}
