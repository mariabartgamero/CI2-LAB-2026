package com.ci2lab.carsharing.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String nombre,
        @Email @NotBlank String email,
        @Size(min = 4) String password,
        @NotBlank String dni,
        @NotBlank String codigoEmpresa
) {
}
