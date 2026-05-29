package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.Car;
import com.ci2lab.carsharing.model.CarStatus;

public record CarMapResponse(
        Long id,
        String matricula,
        int bateria,
        boolean cargando,
        CarStatus estado,
        double latitud,
        double longitud,
        int plazasTotales,
        int plazasDisponibles,
        ReservationResponse reserva
) {
    public static CarMapResponse from(Car car, ReservationResponse reservation) {
        int ocupadas = reservation == null ? 0 : reservation.plazasOcupadas();
        return new CarMapResponse(
                car.getId(),
                car.getMatricula(),
                car.getBateria(),
                car.isCargando(),
                car.getEstado(),
                car.getLatitud(),
                car.getLongitud(),
                car.getPlazasTotales(),
                car.getPlazasTotales() - ocupadas,
                reservation
        );
    }
}
