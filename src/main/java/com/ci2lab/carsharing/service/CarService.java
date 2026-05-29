package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.dto.CarMapResponse;
import com.ci2lab.carsharing.dto.ReservationResponse;
import com.ci2lab.carsharing.exception.AppException;
import com.ci2lab.carsharing.model.Car;
import com.ci2lab.carsharing.model.CarStatus;
import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.ReservationStatus;
import com.ci2lab.carsharing.model.User;
import com.ci2lab.carsharing.repository.CarRepository;
import com.ci2lab.carsharing.repository.ReservationRepository;
import com.ci2lab.carsharing.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CarService {
    private static final List<ReservationStatus> ACTIVE_STATUSES = List.of(
            ReservationStatus.ACTIVE
    );

    private final CarRepository carRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final ReservationService reservationService;

    public CarService(
            CarRepository carRepository,
            ReservationRepository reservationRepository,
            UserRepository userRepository,
            ReservationService reservationService
    ) {
        this.carRepository = carRepository;
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.reservationService = reservationService;
    }

    @Transactional
    public List<CarMapResponse> findAll() {
        reservationService.completeExpiredReservationsIfDue();
        return carRepository.findAll().stream().map(this::toMapResponse).toList();
    }

    @Transactional
    public List<CarMapResponse> findAvailable() {
        reservationService.completeExpiredReservationsIfDue();
        return carRepository.findByEstado(CarStatus.LIBRE).stream().map(this::toMapResponse).toList();
    }

    @Transactional
    public List<CarMapResponse> findVisibleForUser(Long userId) {
        reservationService.completeExpiredReservationsIfDue();
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException("Usuario no encontrado"));
        return carRepository.findAll().stream()
                .map(this::toMapResponse)
                .filter(car -> car.estado() == CarStatus.LIBRE
                        || car.estado() != CarStatus.EN_USO
                        && car.reserva() != null
                        && car.reserva().empresaId().equals(user.getEmpresa().getId()))
                .toList();
    }

    @Scheduled(fixedRate = 10000)
    @Transactional
    public void chargeBatteries() {
        carRepository.findByCargandoTrue().forEach(car -> {
            if (car.getBateria() >= 100) {
                car.setCargando(false);
            } else {
                car.setBateria(Math.min(100, car.getBateria() + 1));
            }
        });
    }

    private CarMapResponse toMapResponse(Car car) {
        Optional<Reservation> activeReservation = reservationRepository.findFirstByCocheIdAndEstadoIn(car.getId(), ACTIVE_STATUSES);
        return CarMapResponse.from(car, activeReservation.map(ReservationResponse::from).orElse(null));
    }
}
