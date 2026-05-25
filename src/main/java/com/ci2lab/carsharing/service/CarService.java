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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CarService {
    private static final List<ReservationStatus> ACTIVE_STATUSES = List.of(
            ReservationStatus.PENDIENTE,
            ReservationStatus.CONFIRMADA,
            ReservationStatus.COMPLETA
    );

    private final CarRepository carRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;

    public CarService(CarRepository carRepository, ReservationRepository reservationRepository, UserRepository userRepository) {
        this.carRepository = carRepository;
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CarMapResponse> findAll() {
        return carRepository.findAll().stream().map(this::toMapResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CarMapResponse> findAvailable() {
        return carRepository.findByEstado(CarStatus.LIBRE).stream().map(this::toMapResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CarMapResponse> findVisibleForUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException("Usuario no encontrado"));
        return carRepository.findAll().stream()
                .map(this::toMapResponse)
                .filter(car -> car.estado() == CarStatus.LIBRE
                        || car.reserva() != null && car.reserva().empresaId().equals(user.getEmpresa().getId()))
                .toList();
    }

    private CarMapResponse toMapResponse(Car car) {
        Optional<Reservation> activeReservation = reservationRepository.findFirstByCocheIdAndEstadoIn(car.getId(), ACTIVE_STATUSES);
        return CarMapResponse.from(car, activeReservation.map(ReservationResponse::from).orElse(null));
    }
}
