package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.CategoriaIncidencia;
import com.ci2lab.carsharing.model.EstadoIncidencia;
import com.ci2lab.carsharing.model.Incidencia;
import com.ci2lab.carsharing.model.PrioridadIncidencia;
import com.ci2lab.carsharing.model.TipoIncidencia;
import java.time.LocalDateTime;

public record IncidenciaResponse(
        Long id,
        Long userId,
        String usuarioNombre,
        Long reservationId,
        Long carId,
        String matricula,
        CategoriaIncidencia categoria,
        TipoIncidencia tipoIncidencia,
        String descripcion,
        EstadoIncidencia estado,
        PrioridadIncidencia prioridad,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
    public static IncidenciaResponse from(Incidencia incidencia) {
        return new IncidenciaResponse(
                incidencia.getId(),
                incidencia.getUsuario().getId(),
                incidencia.getUsuario().getNombre(),
                incidencia.getReserva() == null ? null : incidencia.getReserva().getId(),
                incidencia.getCoche() == null ? null : incidencia.getCoche().getId(),
                incidencia.getCoche() == null ? null : incidencia.getCoche().getMatricula(),
                incidencia.getCategoria(),
                incidencia.getTipoIncidencia(),
                incidencia.getDescripcion(),
                incidencia.getEstado(),
                incidencia.getPrioridad(),
                incidencia.getFechaCreacion(),
                incidencia.getFechaActualizacion()
        );
    }
}
