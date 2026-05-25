package com.ci2lab.carsharing.dto;

import jakarta.validation.constraints.NotNull;

public record UserActionRequest(@NotNull Long userId) {
}
