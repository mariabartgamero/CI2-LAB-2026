package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.CategoriaIncidencia;
import com.ci2lab.carsharing.model.TipoIncidencia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateIncidenciaRequest(
        @NotNull Long userId,
        Long reservationId,
        Long carId,
        @NotNull CategoriaIncidencia categoria,
        @NotNull TipoIncidencia tipoIncidencia,
        @NotBlank @Size(max = 1200) String descripcion
) {
}
