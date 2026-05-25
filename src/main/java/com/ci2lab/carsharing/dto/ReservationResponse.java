package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.ReservationStatus;
import java.time.LocalDateTime;

public record ReservationResponse(
        Long id,
        CarResponse car,
        CompanyResponse company,
        EmployeeResponse createdBy,
        double originLatitude,
        double originLongitude,
        String destination,
        LocalDateTime startTime,
        LocalDateTime endTime,
        ReservationStatus status,
        long participants,
        int capacity
) {
    public static ReservationResponse from(Reservation reservation, long participants) {
        return new ReservationResponse(
                reservation.getId(),
                CarResponse.from(reservation.getCar()),
                CompanyResponse.from(reservation.getCompany()),
                EmployeeResponse.from(reservation.getCreatedBy()),
                reservation.getOriginLatitude(),
                reservation.getOriginLongitude(),
                reservation.getDestination(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getStatus(),
                participants,
                reservation.getCar().getCapacity()
        );
    }
}
