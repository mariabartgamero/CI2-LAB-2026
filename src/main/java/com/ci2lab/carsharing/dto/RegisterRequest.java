package com.ci2lab.carsharing.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String nombre,
        @Email @NotBlank String email,
        @Size(min = 4) String password,
        @NotBlank @Pattern(regexp = "^[0-9]{8}[A-Za-z]$", message = "DNI INCORRECTO") String dni,
        @NotBlank String codigoEmpresa
) {
}
