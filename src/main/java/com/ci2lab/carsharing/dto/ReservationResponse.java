package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.ParticipantStatus;
import com.ci2lab.carsharing.model.ReservationStatus;
import com.ci2lab.carsharing.model.ReservationTripType;
import java.time.Instant;
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
        ReservationTripType tipoTrayecto,
        String destinoNombre,
        String destinoDireccion,
        Double destinoLatitud,
        Double destinoLongitud,
        ReservationStatus estado,
        int puntosPrevistos,
        int plazasOcupadas,
        int plazasDisponibles,
        boolean puntosAsignados,
        ParticipantStatus estadoUsuario,
        boolean trayectoIniciado,
        Integer satisfactionRating,
        Instant horaInicioTrayecto,
        LocalDateTime fechaCreacion
) {
    public static ReservationResponse from(Reservation reservation) {
        return from(reservation, null);
    }

    public static ReservationResponse from(Reservation reservation, ParticipantStatus participantStatus) {
        int occupiedSeats = occupiedSeats(reservation);
        return new ReservationResponse(
                reservation.getId(),
                reservation.getCoche().getId(),
                reservation.getCoche().getMatricula(),
                reservation.getEmpresa().getId(),
                reservation.getEmpresa().getNombre(),
                reservation.getUsuarioCreador().getId(),
                reservation.getParticipantes().stream()
                        .filter(participant -> participant.getStatus() == ParticipantStatus.ACTIVE)
                        .map(OccupantResponse::from)
                        .toList(),
                reservation.getHoraSalida(),
                reservation.getHoraEstimadaLlegada(),
                reservation.getOrigenLatitud(),
                reservation.getOrigenLongitud(),
                reservation.getDestino() == null ? null : OfficeResponse.from(reservation.getDestino()),
                reservation.getTipoTrayecto(),
                reservation.getDestinoNombre(),
                reservation.getDestinoDireccion(),
                reservation.getDestinoLatitud(),
                reservation.getDestinoLongitud(),
                visibleStatus(reservation),
                reservation.getPuntosPrevistos(),
                occupiedSeats,
                Math.max(0, reservation.getCoche().getPlazasTotales() - occupiedSeats),
                reservation.isPuntosAsignados(),
                participantStatus,
                reservation.isTrayectoIniciado(),
                reservation.getSatisfactionRating(),
                reservation.getHoraInicioTrayecto(),
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
        if (reservation.getEstado() == ReservationStatus.EXPIRED) {
            return ReservationStatus.EXPIRED;
        }
        return reservation.getEstado();
    }

    private static int occupiedSeats(Reservation reservation) {
        int uniqueUsers = (int) reservation.getUsuariosApuntados().stream()
                .map(user -> user.getId())
                .distinct()
                .count();
        return Math.max(1, uniqueUsers);
    }
}
