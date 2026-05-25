package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.ReservationStatus;
import java.time.LocalDateTime;
import java.util.List;

public record ReservationResponse(
        Long id,
        Long cocheId,
        String matricula,
        Long empresaId,
        String empresaNombre,
        Long usuarioCreadorId,
        List<String> usuariosApuntados,
        LocalDateTime horaSalida,
        double origenLatitud,
        double origenLongitud,
        OfficeResponse destino,
        ReservationStatus estado,
        int plazasOcupadas,
        int plazasDisponibles,
        LocalDateTime fechaCreacion
) {
    public static ReservationResponse from(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getCoche().getId(),
                reservation.getCoche().getMatricula(),
                reservation.getEmpresa().getId(),
                reservation.getEmpresa().getNombre(),
                reservation.getUsuarioCreador().getId(),
                reservation.getUsuariosApuntados().stream().map(UserResponse::from).map(UserResponse::nombre).toList(),
                reservation.getHoraSalida(),
                reservation.getOrigenLatitud(),
                reservation.getOrigenLongitud(),
                OfficeResponse.from(reservation.getDestino()),
                reservation.getEstado(),
                reservation.getPlazasOcupadas(),
                reservation.getCoche().getPlazasTotales() - reservation.getPlazasOcupadas(),
                reservation.getFechaCreacion()
        );
    }
}
