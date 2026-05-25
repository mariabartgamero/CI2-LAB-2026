package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.dto.CarResponse;
import com.ci2lab.carsharing.dto.CreateCarRequest;
import com.ci2lab.carsharing.exception.NotFoundException;
import com.ci2lab.carsharing.model.Car;
import com.ci2lab.carsharing.model.CarStatus;
import com.ci2lab.carsharing.model.ReservationStatus;
import com.ci2lab.carsharing.repository.CarRepository;
import com.ci2lab.carsharing.repository.ReservationRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CarService {
    private final CarRepository carRepository;
    private final ReservationRepository reservationRepository;

    public CarService(CarRepository carRepository, ReservationRepository reservationRepository) {
        this.carRepository = carRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional
    public CarResponse create(CreateCarRequest request) {
        Car car = new Car();
        car.setBrand(request.brand());
        car.setModel(request.model());
        car.setLicensePlate(request.licensePlate());
        car.setCapacity(request.capacity());
        car.setLatitude(request.latitude());
        car.setLongitude(request.longitude());
        car.setStatus(CarStatus.AVAILABLE);
        return CarResponse.from(carRepository.save(car));
    }

    @Transactional(readOnly = true)
    public List<CarResponse> findAvailable(Double lat, Double lng, Double radiusKm, LocalDateTime startTime, LocalDateTime endTime) {
        return carRepository.findByStatus(CarStatus.AVAILABLE).stream()
                .filter(car -> lat == null || lng == null || radiusKm == null || distanceKm(lat, lng, car.getLatitude(), car.getLongitude()) <= radiusKm)
                .filter(car -> startTime == null || endTime == null || !reservationRepository.existsOverlappingReservation(
                        car.getId(),
                        startTime,
                        endTime,
                        List.of(ReservationStatus.CREATED, ReservationStatus.ACTIVE)
                ))
                .map(CarResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CarResponse findById(Long id) {
        return carRepository.findById(id)
                .map(CarResponse::from)
                .orElseThrow(() -> new NotFoundException("Car not found"));
    }

    private double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
