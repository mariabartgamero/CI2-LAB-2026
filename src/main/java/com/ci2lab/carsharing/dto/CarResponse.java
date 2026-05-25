package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.Car;
import com.ci2lab.carsharing.model.CarStatus;

public record CarResponse(
        Long id,
        String brand,
        String model,
        String licensePlate,
        int capacity,
        double latitude,
        double longitude,
        CarStatus status
) {
    public static CarResponse from(Car car) {
        return new CarResponse(
                car.getId(),
                car.getBrand(),
                car.getModel(),
                car.getLicensePlate(),
                car.getCapacity(),
                car.getLatitude(),
                car.getLongitude(),
                car.getStatus()
        );
    }
}
