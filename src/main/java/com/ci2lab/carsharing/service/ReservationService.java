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
import com.ci2lab.carsharing.model.ReservationTripType;
import com.ci2lab.carsharing.model.User;
import com.ci2lab.carsharing.repository.CarRepository;
import com.ci2lab.carsharing.repository.OfficeRepository;
import com.ci2lab.carsharing.repository.ReservationParticipantRepository;
import com.ci2lab.carsharing.repository.ReservationRepository;
import com.ci2lab.carsharing.repository.UserRepository;
import java.time.Instant;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {
    private static final int DEFAULT_DURATION_MINUTES = 30;
    private static final int DEFAULT_POINTS = 320;
    private static final int MAX_ADVANCE_HOURS = 12;
    private static final int EXPIRATION_GRACE_MINUTES = 15;
    private static final double RETURN_FROM_OFFICE_RADIUS_KM = 0.1;
    private static final Duration TIMED_RESERVATION_SYNC_INTERVAL = Duration.ofSeconds(5);
    private static final List<ReservationStatus> LIVE_STATUSES = List.of(
            ReservationStatus.ACTIVE
    );
    private static final List<ReservationStatus> COUNTED_STATUSES = List.of(
            ReservationStatus.ACTIVE
    );

    private final ReservationRepository reservationRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final OfficeRepository officeRepository;
    private final ReservationParticipantRepository reservationParticipantRepository;
    private Instant lastTimedReservationSync = Instant.EPOCH;

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
        if (car.getEstado() != CarStatus.LIBRE) {
            throw new AppException("Este coche no esta libre");
        }
        reservationRepository.findFirstByUsuariosApuntadosIdAndEstadoIn(user.getId(), LIVE_STATUSES)
                .ifPresent(active -> {
                    throw new AppException("Ya tienes una reserva activa");
                });

        ReservationTripType tripType = request.tipoTrayecto() == null ? ReservationTripType.IDA : request.tipoTrayecto();
        Office office = null;
        String destinationName;
        String destinationAddress;
        Double destinationLatitude;
        Double destinationLongitude;

        if (tripType == ReservationTripType.IDA) {
            if (request.officeId() == null) {
                throw new AppException("Selecciona una oficina destino");
            }
            office = officeRepository.findById(request.officeId())
                    .orElseThrow(() -> new AppException("Oficina no encontrada"));
            if (!office.getEmpresa().getId().equals(user.getEmpresa().getId())) {
                throw new AppException("La oficina destino debe pertenecer a tu empresa");
            }
            if (isCarAtOffice(car, office)) {
                throw new AppException("El coche ya esta en esa oficina");
            }
            destinationName = office.getNombre();
            destinationAddress = office.getDireccion();
            destinationLatitude = office.getLatitud();
            destinationLongitude = office.getLongitud();
        } else {
            if (!isCarAtCompanyOffice(car, user)) {
                throw new AppException("La vuelta solo se puede iniciar desde una oficina");
            }
            destinationName = cleanText(request.destinoNombre());
            destinationAddress = cleanText(request.destinoDireccion());
            destinationLatitude = request.destinoLatitud();
            destinationLongitude = request.destinoLongitud();
            if (destinationAddress.isBlank() || destinationLatitude == null || destinationLongitude == null) {
                throw new AppException("Indica direccion y coordenadas de destino");
            }
            if (destinationName.isBlank()) {
                destinationName = destinationAddress;
            }
        }

        LocalDateTime startTime = request.horaSalida() == null ? LocalDateTime.now() : request.horaSalida();
        int durationMinutes = request.duracionMinutos() == null ? DEFAULT_DURATION_MINUTES : Math.max(1, request.duracionMinutos());
        int points = request.puntosPrevistos() == null ? DEFAULT_POINTS : Math.max(0, request.puntosPrevistos());

        if (startTime.isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw new AppException("La hora de inicio no puede estar en el pasado");
        }
        if (startTime.isAfter(LocalDateTime.now().plusHours(MAX_ADVANCE_HOURS))) {
            throw new AppException("Solo puedes reservar con 12 horas de antelacion como maximo");
        }
        validateOneReservationPerDay(user.getId(), tripType, startTime);

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
        reservation.setTipoTrayecto(tripType);
        reservation.setDestinoNombre(destinationName);
        reservation.setDestinoDireccion(destinationAddress);
        reservation.setDestinoLatitud(destinationLatitude);
        reservation.setDestinoLongitud(destinationLongitude);
        reservation.setEstado(ReservationStatus.ACTIVE);
        reservation.setTrayectoIniciado(false);
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

        if (!isBookable(reservation)) {
            throw new AppException("Esta reserva ya no acepta ocupantes");
        }
        if (!reservation.getHoraSalida().isAfter(LocalDateTime.now())) {
            throw new AppException("Ya no puedes unirte a esta reserva");
        }
        if (!reservation.getEmpresa().getId().equals(user.getEmpresa().getId())) {
            throw new AppException("Solo puedes unirte a reservas de tu empresa");
        }
        if (reservation.getUsuariosApuntados().stream().anyMatch(existing -> existing.getId().equals(user.getId()))) {
            throw new AppException("Ya estas apuntado a esta reserva");
        }
        if (occupiedSeats(reservation) >= reservation.getCoche().getPlazasTotales()) {
            throw new AppException("El coche ya esta completo");
        }
        validateOneReservationPerDay(user.getId(), reservation.getTipoTrayecto(), reservation.getHoraSalida());
        reservationRepository.findFirstByUsuariosApuntadosIdAndEstadoIn(user.getId(), LIVE_STATUSES)
                .ifPresent(active -> {
                    throw new AppException("Ya tienes una reserva activa");
                });

        reservation.getUsuariosApuntados().add(user);
        addParticipantHistory(reservation, user);
        reservation.setPlazasOcupadas(occupiedSeats(reservation));
        updateCarStatusByOccupancy(reservation);
        return ReservationResponse.from(reservation);
    }

    @Transactional
    public ReservationResponse start(Long reservationId, Long userId) {
        completeExpiredReservations();
        Reservation reservation = findReservation(reservationId);
        validateParticipant(reservation, userId);
        validateCreator(reservation, userId);
        if (!isBookable(reservation)) {
            throw new AppException("Solo se pueden iniciar reservas pendientes");
        }
        if (!canStartTrip(reservation)) {
            throw new AppException("Aun no puedes iniciar el viaje: faltan pasajeros por marcarse como listos");
        }

        long durationMinutes = Math.max(1, Duration.between(
                reservation.getHoraSalida(),
                reservation.getHoraEstimadaLlegada()
        ).toMinutes());
        reservation.setHoraInicioTrayecto(Instant.now());
        reservation.setHoraEstimadaLlegada(LocalDateTime.now().plusMinutes(durationMinutes));
        reservation.setTrayectoIniciado(true);
        reservation.getCoche().setEstado(CarStatus.EN_USO);
        return ReservationResponse.from(reservation);
    }

    @Transactional
    public ReservationResponse ready(Long reservationId, Long userId) {
        completeExpiredReservations();
        Reservation reservation = findReservation(reservationId);
        validateParticipant(reservation, userId);
        if (!isBookable(reservation)) {
            throw new AppException("Solo puedes marcarte listo antes de iniciar el trayecto");
        }
        if (reservation.getUsuarioCreador().getId().equals(userId)) {
            throw new AppException("El conductor no necesita marcarse como listo");
        }

        ReservationParticipant participant = reservationParticipantRepository
                .findFirstByReservationIdAndUserIdAndStatus(reservationId, userId, ParticipantStatus.ACTIVE)
                .orElseThrow(() -> new AppException("No tienes una participacion activa en esta reserva"));
        participant.setReady(true);
        participant.setReadyAt(LocalDateTime.now());
        return ReservationResponse.from(reservation);
    }

    @Transactional
    public ReservationResponse finish(Long reservationId, Long userId) {
        completeExpiredReservations();
        Reservation reservation = findReservation(reservationId);
        validateParticipant(reservation, userId);
        validateCreator(reservation, userId);
        if (!isInProgress(reservation)) {
            throw new AppException("Solo se pueden finalizar trayectos en curso");
        }

        reservation.setHoraEstimadaLlegada(LocalDateTime.now());
        completeReservation(reservation);
        return ReservationResponse.from(reservation);
    }

    @Transactional
    public ReservationResponse cancel(Long reservationId, Long userId) {
        completeExpiredReservations();
        Reservation reservation = findReservation(reservationId);
        validateParticipant(reservation, userId);
        if (!isBookable(reservation)) {
            throw new AppException("Solo se pueden cancelar reservas antes de iniciar el trayecto");
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
    public ReservationResponse rate(Long reservationId, Long userId, Integer rating) {
        Reservation reservation = findReservation(reservationId);
        if (reservation.getEstado() != ReservationStatus.COMPLETED) {
            throw new AppException("Solo se pueden valorar reservas finalizadas");
        }
        if (rating == null || rating < 1 || rating > 5) {
            throw new AppException("La valoracion debe estar entre 1 y 5");
        }
        validateParticipantHistory(reservation, userId);

        reservation.setSatisfactionRating(rating);
        return ReservationResponse.from(reservation);
    }

    @Transactional
    public ReservationResponse findActiveByUser(Long userId) {
        completeExpiredReservationsIfDue();
        return reservationRepository.findFirstByUsuariosApuntadosIdAndEstadoIn(userId, LIVE_STATUSES)
                .map(ReservationResponse::from)
                .orElse(null);
    }

    @Transactional
    public List<ReservationResponse> findByUser(Long userId) {
        completeExpiredReservationsIfDue();
        return reservationParticipantRepository.findByUserIdOrderByReservationHoraSalidaDesc(userId).stream()
                .map(participant -> ReservationResponse.from(participant.getReservation(), participant.getStatus()))
                .toList();
    }

    public void completeExpiredReservationsIfDue() {
        if (shouldRunTimedReservationSync()) {
            completeExpiredReservations();
        }
    }

    @Transactional
    public void completeExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();
        reservationRepository
                .findPendingReservationsToStart(ReservationStatus.ACTIVE, now)
                .forEach(this::startReservationBySchedule);

        LocalDateTime cutoff = now.minusMinutes(EXPIRATION_GRACE_MINUTES);
        reservationRepository
                .findPendingReservationsToExpire(ReservationStatus.ACTIVE, cutoff)
                .forEach(this::expireReservation);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expireOldReservations() {
        completeExpiredReservations();
    }

    private synchronized boolean shouldRunTimedReservationSync() {
        Instant now = Instant.now();
        if (lastTimedReservationSync.plus(TIMED_RESERVATION_SYNC_INTERVAL).isAfter(now)) {
            return false;
        }
        lastTimedReservationSync = now;
        return true;
    }

    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new AppException("Usuario no encontrado"));
    }

    private Reservation findReservation(Long id) {
        return reservationRepository.findById(id).orElseThrow(() -> new AppException("Reserva no encontrada"));
    }

    private void validateOneReservationPerDay(Long userId, ReservationTripType tripType, LocalDateTime startTime) {
        LocalDateTime startOfDay = startTime.toLocalDate().atStartOfDay();
        LocalDateTime startOfNextDay = startOfDay.plusDays(1);
        boolean hasReservation = reservationRepository.existsCountedReservationForUserOnDayAndType(
                userId,
                COUNTED_STATUSES,
                tripType,
                startOfDay,
                startOfNextDay
        );
        if (hasReservation) {
            throw new AppException("Solo puedes tener una reserva de este tipo por dia");
        }
    }

    private void completeReservation(Reservation reservation) {
        reservation.setEstado(ReservationStatus.COMPLETED);
        reservation.setTrayectoIniciado(false);
        Car car = reservation.getCoche();
        car.setEstado(CarStatus.LIBRE);
        car.setLatitud(reservation.getDestinoLatitud());
        car.setLongitud(reservation.getDestinoLongitud());
        carRepository.save(car);

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

    private void expireReservation(Reservation reservation) {
        reservation.setEstado(ReservationStatus.EXPIRED);
        reservation.setTrayectoIniciado(false);
        reservation.getCoche().setEstado(CarStatus.LIBRE);
    }

    private void startReservationBySchedule(Reservation reservation) {
        reservation.setTrayectoIniciado(true);
        if (reservation.getHoraInicioTrayecto() == null) {
            reservation.setHoraInicioTrayecto(Instant.now());
        }
        reservation.getCoche().setEstado(CarStatus.EN_USO);
    }

    private void addParticipantHistory(Reservation reservation, User user) {
        ReservationParticipant participant = new ReservationParticipant(reservation, user);
        reservation.getParticipantes().add(participant);
    }

    private String cleanText(String value) {
        return value == null ? "" : value.trim();
    }

    private void validateParticipant(Reservation reservation, Long userId) {
        boolean isParticipant = reservation.getUsuariosApuntados().stream().anyMatch(user -> user.getId().equals(userId));
        if (!isParticipant) {
            throw new AppException("No formas parte de esta reserva");
        }
    }

    private void validateParticipantHistory(Reservation reservation, Long userId) {
        boolean isParticipant = reservation.getParticipantes().stream()
                .anyMatch(participant -> participant.getUser().getId().equals(userId));
        if (!isParticipant) {
            throw new AppException("No formas parte de esta reserva");
        }
    }

    private void validateCreator(Reservation reservation, Long userId) {
        if (!reservation.getUsuarioCreador().getId().equals(userId)) {
            throw new AppException("Solo el conductor puede iniciar este viaje");
        }
    }

    private boolean canStartTrip(Reservation reservation) {
        LocalDateTime now = LocalDateTime.now();
        if (!now.isBefore(reservation.getHoraSalida())) {
            return true;
        }

        List<ReservationParticipant> passengers = reservation.getParticipantes().stream()
                .filter(participant -> participant.getStatus() == ParticipantStatus.ACTIVE)
                .filter(participant -> !participant.getUser().getId().equals(reservation.getUsuarioCreador().getId()))
                .toList();
        return passengers.isEmpty() || passengers.stream().allMatch(ReservationParticipant::isReady);
    }

    private boolean isBookable(Reservation reservation) {
        return reservation.getEstado() == ReservationStatus.ACTIVE && !reservation.isTrayectoIniciado();
    }

    private boolean isInProgress(Reservation reservation) {
        return reservation.getEstado() == ReservationStatus.ACTIVE && reservation.isTrayectoIniciado();
    }

    private int pointsForCompletedTrip(Reservation reservation) {
        if (reservation.getPlazasOcupadas() < 2) {
            return 0;
        }
        return reservation.getPuntosPrevistos();
    }

    private int occupiedSeats(Reservation reservation) {
        int uniqueUsers = (int) reservation.getUsuariosApuntados().stream()
                .map(User::getId)
                .distinct()
                .count();
        return Math.max(1, uniqueUsers);
    }

    private boolean isCarAtCompanyOffice(Car car, User user) {
        return officeRepository.findByEmpresaId(user.getEmpresa().getId()).stream()
                .anyMatch(office -> isCarAtOffice(car, office));
    }

    private boolean isCarAtOffice(Car car, Office office) {
        return distanceKm(
                car.getLatitud(),
                car.getLongitud(),
                office.getLatitud(),
                office.getLongitud()
        ) <= RETURN_FROM_OFFICE_RADIUS_KM;
    }

    private double distanceKm(double fromLat, double fromLng, double toLat, double toLng) {
        double earthRadiusKm = 6371;
        double dLat = Math.toRadians(toLat - fromLat);
        double dLng = Math.toRadians(toLng - fromLng);
        double lat1 = Math.toRadians(fromLat);
        double lat2 = Math.toRadians(toLat);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private void updateCarStatusByOccupancy(Reservation reservation) {
        int occupiedSeats = occupiedSeats(reservation);
        reservation.setPlazasOcupadas(occupiedSeats);
        if (occupiedSeats >= reservation.getCoche().getPlazasTotales()) {
            reservation.getCoche().setEstado(CarStatus.COMPLETO);
        } else if (occupiedSeats >= 2) {
            reservation.getCoche().setEstado(CarStatus.RESERVA_CONFIRMADA);
        } else {
            reservation.getCoche().setEstado(CarStatus.RESERVA_PENDIENTE);
        }
    }
}
