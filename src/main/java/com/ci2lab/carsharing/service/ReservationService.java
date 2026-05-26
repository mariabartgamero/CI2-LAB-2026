package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.dto.CreateReservationRequest;
import com.ci2lab.carsharing.dto.ReservationResponse;
import com.ci2lab.carsharing.exception.AppException;
import com.ci2lab.carsharing.model.Car;
import com.ci2lab.carsharing.model.CarStatus;
import com.ci2lab.carsharing.model.Office;
import com.ci2lab.carsharing.model.ParticipantStatus;
import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.ReservationParticipant;
import com.ci2lab.carsharing.model.ReservationStatus;
import com.ci2lab.carsharing.model.User;
import com.ci2lab.carsharing.repository.CarRepository;
import com.ci2lab.carsharing.repository.OfficeRepository;
import com.ci2lab.carsharing.repository.ReservationParticipantRepository;
import com.ci2lab.carsharing.repository.ReservationRepository;
import com.ci2lab.carsharing.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {
    private static final int DEFAULT_DURATION_MINUTES = 30;
    private static final int DEFAULT_POINTS = 320;
    private static final int MAX_ADVANCE_HOURS = 12;
    private static final List<ReservationStatus> ACTIVE_STATUSES = List.of(
            ReservationStatus.ACTIVE
    );

    private final ReservationRepository reservationRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final OfficeRepository officeRepository;
    private final ReservationParticipantRepository reservationParticipantRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            CarRepository carRepository,
            UserRepository userRepository,
            OfficeRepository officeRepository,
            ReservationParticipantRepository reservationParticipantRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.carRepository = carRepository;
        this.userRepository = userRepository;
        this.officeRepository = officeRepository;
        this.reservationParticipantRepository = reservationParticipantRepository;
    }

    @Transactional
    public ReservationResponse create(CreateReservationRequest request) {
        completeExpiredReservations();
        User user = findUser(request.userId());
        Car car = carRepository.findById(request.carId()).orElseThrow(() -> new AppException("Coche no encontrado"));
        Office office = officeRepository.findById(request.officeId())
                .orElseThrow(() -> new AppException("Oficina no encontrada"));

        if (car.getEstado() != CarStatus.LIBRE) {
            throw new AppException("Este coche no esta libre");
        }
        if (!office.getEmpresa().getId().equals(user.getEmpresa().getId())) {
            throw new AppException("La oficina destino debe pertenecer a tu empresa");
        }
        reservationRepository.findFirstByUsuariosApuntadosIdAndEstado(user.getId(), ReservationStatus.ACTIVE)
                .ifPresent(active -> {
                    throw new AppException("Ya tienes una reserva activa");
                });

        LocalDateTime startTime = request.horaSalida() == null ? LocalDateTime.now() : request.horaSalida();
        int durationMinutes = request.duracionMinutos() == null ? DEFAULT_DURATION_MINUTES : Math.max(1, request.duracionMinutos());
        int points = request.puntosPrevistos() == null ? DEFAULT_POINTS : Math.max(0, request.puntosPrevistos());

        if (startTime.isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw new AppException("La hora de inicio no puede estar en el pasado");
        }
        if (startTime.isAfter(LocalDateTime.now().plusHours(MAX_ADVANCE_HOURS))) {
            throw new AppException("Solo puedes reservar con 12 horas de antelacion como maximo");
        }
        validateOneReservationPerDay(user.getId(), startTime);

        Reservation reservation = new Reservation();
        reservation.setCoche(car);
        reservation.setEmpresa(user.getEmpresa());
        reservation.setUsuarioCreador(user);
        reservation.getUsuariosApuntados().add(user);
        reservation.setHoraSalida(startTime);
        reservation.setHoraEstimadaLlegada(startTime.plusMinutes(durationMinutes));
        reservation.setOrigenLatitud(car.getLatitud());
        reservation.setOrigenLongitud(car.getLongitud());
        reservation.setDestino(office);
        reservation.setEstado(ReservationStatus.ACTIVE);
        reservation.setPuntosPrevistos(points);
        reservation.setPlazasOcupadas(1);
        addParticipantHistory(reservation, user);

        car.setEstado(CarStatus.RESERVA_PENDIENTE);
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse join(Long reservationId, Long userId) {
        completeExpiredReservations();
        Reservation reservation = findReservation(reservationId);
        User user = findUser(userId);

        if (reservation.getEstado() != ReservationStatus.ACTIVE) {
            throw new AppException("Esta reserva ya no acepta ocupantes");
        }
        if (!reservation.getHoraSalida().isAfter(LocalDateTime.now())) {
            throw new AppException("No puedes unirte a una reserva que ya ha salido");
        }
        if (!reservation.getEmpresa().getId().equals(user.getEmpresa().getId())) {
            throw new AppException("Solo puedes unirte a reservas de tu empresa");
        }
        if (reservation.getUsuariosApuntados().stream().anyMatch(existing -> existing.getId().equals(user.getId()))) {
            throw new AppException("Ya estas apuntado a esta reserva");
        }
        if (reservation.getPlazasOcupadas() >= reservation.getCoche().getPlazasTotales()) {
            throw new AppException("El coche ya esta completo");
        }
        validateOneReservationPerDay(user.getId(), reservation.getHoraSalida());
        reservationRepository.findFirstByUsuariosApuntadosIdAndEstado(user.getId(), ReservationStatus.ACTIVE)
                .ifPresent(active -> {
                    throw new AppException("Ya tienes una reserva activa");
                });

        reservation.getUsuariosApuntados().add(user);
        addParticipantHistory(reservation, user);
        reservation.setPlazasOcupadas(reservation.getUsuariosApuntados().size());
        updateCarStatusByOccupancy(reservation);
        return ReservationResponse.from(reservation);
    }

    @Transactional
    public ReservationResponse finish(Long reservationId) {
        Reservation reservation = findReservation(reservationId);
        if (reservation.getEstado() != ReservationStatus.ACTIVE) {
            throw new AppException("La reserva no se puede finalizar");
        }

        completeReservation(reservation);
        return ReservationResponse.from(reservation);
    }

    @Transactional
    public ReservationResponse cancel(Long reservationId, Long userId) {
        Reservation reservation = findReservation(reservationId);
        boolean isParticipant = reservation.getUsuariosApuntados().stream().anyMatch(user -> user.getId().equals(userId));
        if (!isParticipant) {
            throw new AppException("No formas parte de esta reserva");
        }
        if (reservation.getEstado() != ReservationStatus.ACTIVE) {
            throw new AppException("Solo se pueden cancelar reservas activas");
        }

        ReservationParticipant participant = reservationParticipantRepository
                .findFirstByReservationIdAndUserIdAndStatus(reservationId, userId, ParticipantStatus.ACTIVE)
                .orElseThrow(() -> new AppException("No tienes una participacion activa en esta reserva"));
        participant.setStatus(ParticipantStatus.CANCELLED);
        participant.setCancelledAt(LocalDateTime.now());

        reservation.getUsuariosApuntados().removeIf(user -> user.getId().equals(userId));
        reservation.setPlazasOcupadas(reservation.getUsuariosApuntados().size());

        if (reservation.getPlazasOcupadas() == 0) {
            reservation.setEstado(ReservationStatus.CANCELLED);
            reservation.getCoche().setEstado(CarStatus.LIBRE);
        } else {
            if (reservation.getUsuarioCreador().getId().equals(userId)) {
                reservation.setUsuarioCreador(reservation.getUsuariosApuntados().get(0));
            }
            updateCarStatusByOccupancy(reservation);
        }
        return ReservationResponse.from(reservation);
    }

    @Transactional
    public ReservationResponse findActiveByUser(Long userId) {
        completeExpiredReservations();
        return reservationRepository.findFirstByUsuariosApuntadosIdAndEstado(userId, ReservationStatus.ACTIVE)
                .map(ReservationResponse::from)
                .orElse(null);
    }

    @Transactional
    public List<ReservationResponse> findByUser(Long userId) {
        completeExpiredReservations();
        return reservationParticipantRepository.findByUserIdOrderByReservationHoraSalidaDesc(userId).stream()
                .map(participant -> ReservationResponse.from(participant.getReservation(), participant.getStatus()))
                .toList();
    }

    @Transactional
    public void completeExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> expiredReservations = reservationRepository.findByEstadoAndHoraEstimadaLlegadaLessThanEqual(
                ReservationStatus.ACTIVE,
                now
        );
        expiredReservations.forEach(this::completeReservation);

        List<Reservation> startedReservations = reservationRepository.findByEstadoAndHoraSalidaLessThanEqualAndHoraEstimadaLlegadaAfter(
                ReservationStatus.ACTIVE,
                now,
                now
        );
        startedReservations.forEach(reservation -> reservation.getCoche().setEstado(CarStatus.EN_USO));
    }

    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new AppException("Usuario no encontrado"));
    }

    private Reservation findReservation(Long id) {
        return reservationRepository.findById(id).orElseThrow(() -> new AppException("Reserva no encontrada"));
    }

    private void validateOneReservationPerDay(Long userId, LocalDateTime startTime) {
        LocalDateTime startOfDay = startTime.toLocalDate().atStartOfDay();
        LocalDateTime startOfNextDay = startOfDay.plusDays(1);
        boolean hasReservation = reservationRepository.existsCountedReservationForUserOnDay(
                userId,
                List.of(ReservationStatus.ACTIVE, ReservationStatus.COMPLETED),
                startOfDay,
                startOfNextDay
        );
        if (hasReservation) {
            throw new AppException("Solo puedes tener una reserva por dia");
        }
    }

    private void completeReservation(Reservation reservation) {
        reservation.setEstado(ReservationStatus.COMPLETED);
        Car car = reservation.getCoche();
        car.setEstado(CarStatus.LIBRE);
        car.setLatitud(reservation.getDestino().getLatitud());
        car.setLongitud(reservation.getDestino().getLongitud());

        if (!reservation.isPuntosAsignados()) {
            int awardedPoints = pointsForCompletedTrip(reservation);
            reservation.getUsuariosApuntados().forEach(user ->
                    user.setPuntosResponsables(user.getPuntosResponsables() + awardedPoints)
            );
            reservation.getParticipantes().stream()
                    .filter(participant -> participant.getStatus() == ParticipantStatus.ACTIVE)
                    .forEach(participant -> {
                        participant.setStatus(ParticipantStatus.COMPLETED);
                        participant.setCompletedAt(LocalDateTime.now());
                    });
            reservation.setPuntosAsignados(true);
        }
    }

    private void addParticipantHistory(Reservation reservation, User user) {
        ReservationParticipant participant = new ReservationParticipant(reservation, user);
        reservation.getParticipantes().add(participant);
    }

    private int pointsForCompletedTrip(Reservation reservation) {
        if (reservation.getPlazasOcupadas() < 2) {
            return Math.round(reservation.getPuntosPrevistos() / 2.0f);
        }
        return reservation.getPuntosPrevistos();
    }

    private void updateCarStatusByOccupancy(Reservation reservation) {
        int occupiedSeats = reservation.getPlazasOcupadas();
        if (occupiedSeats >= reservation.getCoche().getPlazasTotales()) {
            reservation.getCoche().setEstado(CarStatus.COMPLETO);
        } else if (occupiedSeats >= 2) {
            reservation.getCoche().setEstado(CarStatus.RESERVA_CONFIRMADA);
        } else {
            reservation.getCoche().setEstado(CarStatus.RESERVA_PENDIENTE);
        }
    }
}
