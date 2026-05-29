package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.EstadoIncidencia;
import jakarta.validation.constraints.NotNull;

public record UpdateIncidenciaEstadoRequest(@NotNull EstadoIncidencia estado) {
}
