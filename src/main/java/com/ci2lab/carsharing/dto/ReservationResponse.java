package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.ParticipantStatus;
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
        List<OccupantResponse> usuariosApuntados,
        LocalDateTime horaSalida,
        LocalDateTime horaEstimadaLlegada,
        double origenLatitud,
        double origenLongitud,
        OfficeResponse destino,
        ReservationStatus estado,
        int puntosPrevistos,
        int plazasOcupadas,
        int plazasDisponibles,
        boolean puntosAsignados,
        ParticipantStatus estadoUsuario,
        LocalDateTime fechaCreacion
) {
    public static ReservationResponse from(Reservation reservation) {
        return from(reservation, null);
    }

    public static ReservationResponse from(Reservation reservation, ParticipantStatus participantStatus) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getCoche().getId(),
                reservation.getCoche().getMatricula(),
                reservation.getEmpresa().getId(),
                reservation.getEmpresa().getNombre(),
                reservation.getUsuarioCreador().getId(),
                reservation.getUsuariosApuntados().stream().map(OccupantResponse::from).toList(),
                reservation.getHoraSalida(),
                reservation.getHoraEstimadaLlegada(),
                reservation.getOrigenLatitud(),
                reservation.getOrigenLongitud(),
                OfficeResponse.from(reservation.getDestino()),
                visibleStatus(reservation),
                reservation.getPuntosPrevistos(),
                reservation.getPlazasOcupadas(),
                reservation.getCoche().getPlazasTotales() - reservation.getPlazasOcupadas(),
                reservation.isPuntosAsignados(),
                participantStatus,
                reservation.getFechaCreacion()
        );
    }

    private static ReservationStatus visibleStatus(Reservation reservation) {
        if (reservation.getEstado() == ReservationStatus.ACTIVE && reservation.isTrayectoIniciado()) {
            return ReservationStatus.EN_CURSO;
        }
        if (reservation.getEstado() == ReservationStatus.ACTIVE) {
            return ReservationStatus.PENDIENTE;
        }
        if (reservation.getEstado() == ReservationStatus.COMPLETED) {
            return ReservationStatus.FINALIZADA;
        }
        if (reservation.getEstado() == ReservationStatus.CANCELLED) {
            return ReservationStatus.CANCELADA;
        }
        return reservation.getEstado();
    }
}
