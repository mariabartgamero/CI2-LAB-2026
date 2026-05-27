package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.ReservationTripType;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateReservationRequest(
        @NotNull Long userId,
        @NotNull Long carId,
        ReservationTripType tipoTrayecto,
        Long officeId,
        String destinoNombre,
        String destinoDireccion,
        Double destinoLatitud,
        Double destinoLongitud,
        LocalDateTime horaSalida,
        Integer duracionMinutos,
        Integer puntosPrevistos
) {
}
