package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.dto.CreateReservationRequest;
import com.ci2lab.carsharing.dto.ReservationResponse;
import com.ci2lab.carsharing.exception.AppException;
import com.ci2lab.carsharing.model.Car;
import com.ci2lab.carsharing.model.CarStatus;
import com.ci2lab.carsharing.model.Office;
import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.ReservationStatus;
import com.ci2lab.carsharing.model.User;
import com.ci2lab.carsharing.repository.CarRepository;
import com.ci2lab.carsharing.repository.OfficeRepository;
import com.ci2lab.carsharing.repository.ReservationRepository;
import com.ci2lab.carsharing.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {
    private static final int RESPONSIBLE_POINTS = 25;
    private static final List<ReservationStatus> ACTIVE_STATUSES = List.of(
            ReservationStatus.PENDIENTE,
            ReservationStatus.CONFIRMADA,
            ReservationStatus.COMPLETA
    );

    private final ReservationRepository reservationRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final OfficeRepository officeRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            CarRepository carRepository,
            UserRepository userRepository,
            OfficeRepository officeRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.carRepository = carRepository;
        this.userRepository = userRepository;
        this.officeRepository = officeRepository;
    }

    @Transactional
    public ReservationResponse create(CreateReservationRequest request) {
        User user = findUser(request.userId());
        Car car = carRepository.findById(request.carId()).orElseThrow(() -> new AppException("Coche no encontrado"));
        Office office = officeRepository.findById(request.officeId()).orElseThrow(() -> new AppException("Oficina no encontrada"));

        if (car.getEstado() != CarStatus.LIBRE) {
            throw new AppException("Este coche no esta libre");
        }
        if (!office.getEmpresa().getId().equals(user.getEmpresa().getId())) {
            throw new AppException("La oficina destino debe pertenecer a tu empresa");
        }

        Reservation reservation = new Reservation();
        reservation.setCoche(car);
        reservation.setEmpresa(user.getEmpresa());
        reservation.setUsuarioCreador(user);
        reservation.getUsuariosApuntados().add(user);
        reservation.setHoraSalida(request.horaSalida());
        reservation.setOrigenLatitud(car.getLatitud());
        reservation.setOrigenLongitud(car.getLongitud());
        reservation.setDestino(office);
        reservation.setEstado(ReservationStatus.PENDIENTE);
        reservation.setPlazasOcupadas(1);

        car.setEstado(CarStatus.RESERVA_PENDIENTE);
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse join(Long reservationId, Long userId) {
        Reservation reservation = findReservation(reservationId);
        User user = findUser(userId);

        if (!ACTIVE_STATUSES.contains(reservation.getEstado())) {
            throw new AppException("Esta reserva ya no acepta pasajeros");
        }
        if (!reservation.getEmpresa().getId().equals(user.getEmpresa().getId())) {
            throw new AppException("No puedes unirte a reservas de otra empresa");
        }
        if (reservation.getUsuariosApuntados().stream().anyMatch(existing -> existing.getId().equals(user.getId()))) {
            throw new AppException("Ya estas apuntado a esta reserva");
        }
        if (reservation.getPlazasOcupadas() >= reservation.getCoche().getPlazasTotales()) {
            throw new AppException("El coche ya esta completo");
        }

        reservation.getUsuariosApuntados().add(user);
        reservation.setPlazasOcupadas(reservation.getUsuariosApuntados().size());
        refreshReservationAndCarStatus(reservation);
        return ReservationResponse.from(reservation);
    }

    @Transactional
    public ReservationResponse finish(Long reservationId) {
        Reservation reservation = findReservation(reservationId);
        if (!ACTIVE_STATUSES.contains(reservation.getEstado())) {
            throw new AppException("La reserva no se puede finalizar");
        }

        reservation.setEstado(ReservationStatus.FINALIZADA);
        Car car = reservation.getCoche();
        car.setEstado(CarStatus.LIBRE);
        car.setLatitud(reservation.getDestino().getLatitud());
        car.setLongitud(reservation.getDestino().getLongitud());

        reservation.getUsuariosApuntados().forEach(user ->
                user.setPuntosResponsables(user.getPuntosResponsables() + RESPONSIBLE_POINTS)
        );

        return ReservationResponse.from(reservation);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> findByUser(Long userId) {
        return reservationRepository.findByUsuariosApuntadosIdOrderByHoraSalidaDesc(userId).stream()
                .map(ReservationResponse::from)
                .toList();
    }

    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new AppException("Usuario no encontrado"));
    }

    private Reservation findReservation(Long id) {
        return reservationRepository.findById(id).orElseThrow(() -> new AppException("Reserva no encontrada"));
    }

    private void refreshReservationAndCarStatus(Reservation reservation) {
        int plazas = reservation.getPlazasOcupadas();
        if (plazas >= reservation.getCoche().getPlazasTotales()) {
            reservation.setEstado(ReservationStatus.COMPLETA);
            reservation.getCoche().setEstado(CarStatus.COMPLETO);
        } else if (plazas >= 2) {
            reservation.setEstado(ReservationStatus.CONFIRMADA);
            reservation.getCoche().setEstado(CarStatus.RESERVA_CONFIRMADA);
        } else {
            reservation.setEstado(ReservationStatus.PENDIENTE);
            reservation.getCoche().setEstado(CarStatus.RESERVA_PENDIENTE);
        }
    }
}
