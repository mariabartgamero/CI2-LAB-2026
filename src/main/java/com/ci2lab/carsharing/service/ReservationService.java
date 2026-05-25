package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.dto.CreateReservationRequest;
import com.ci2lab.carsharing.dto.ReservationResponse;
import com.ci2lab.carsharing.exception.BadRequestException;
import com.ci2lab.carsharing.exception.NotFoundException;
import com.ci2lab.carsharing.model.Car;
import com.ci2lab.carsharing.model.Employee;
import com.ci2lab.carsharing.model.ParticipantStatus;
import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.ReservationStatus;
import com.ci2lab.carsharing.model.RideParticipant;
import com.ci2lab.carsharing.repository.CarRepository;
import com.ci2lab.carsharing.repository.ReservationRepository;
import com.ci2lab.carsharing.repository.RideParticipantRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {
    private static final List<ReservationStatus> ACTIVE_BOOKING_STATUSES = List.of(
            ReservationStatus.CREATED,
            ReservationStatus.ACTIVE
    );

    private final ReservationRepository reservationRepository;
    private final RideParticipantRepository participantRepository;
    private final CarRepository carRepository;
    private final CurrentEmployeeService currentEmployeeService;

    public ReservationService(
            ReservationRepository reservationRepository,
            RideParticipantRepository participantRepository,
            CarRepository carRepository,
            CurrentEmployeeService currentEmployeeService
    ) {
        this.reservationRepository = reservationRepository;
        this.participantRepository = participantRepository;
        this.carRepository = carRepository;
        this.currentEmployeeService = currentEmployeeService;
    }

    @Transactional
    public ReservationResponse create(CreateReservationRequest request) {
        if (!request.endTime().isAfter(request.startTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        Employee employee = currentEmployeeService.getCurrentEmployee();
        Car car = carRepository.findById(request.carId())
                .orElseThrow(() -> new NotFoundException("Car not found"));

        boolean overlaps = reservationRepository.existsOverlappingReservation(
                car.getId(),
                request.startTime(),
                request.endTime(),
                ACTIVE_BOOKING_STATUSES
        );
        if (overlaps) {
            throw new BadRequestException("Car already has an active reservation in that time range");
        }

        Reservation reservation = new Reservation();
        reservation.setCar(car);
        reservation.setCompany(employee.getCompany());
        reservation.setCreatedBy(employee);
        reservation.setOriginLatitude(request.originLatitude());
        reservation.setOriginLongitude(request.originLongitude());
        reservation.setDestination(request.destination());
        reservation.setStartTime(request.startTime());
        reservation.setEndTime(request.endTime());
        reservation.setStatus(ReservationStatus.CREATED);

        Reservation saved = reservationRepository.save(reservation);
        addParticipant(saved, employee);
        return toResponse(saved);
    }

    @Transactional
    public ReservationResponse join(Long reservationId) {
        Employee employee = currentEmployeeService.getCurrentEmployee();
        Reservation reservation = findReservation(reservationId);

        if (!reservation.getCompany().getId().equals(employee.getCompany().getId())) {
            throw new BadRequestException("Only employees from the same company can join this ride");
        }
        if (!ACTIVE_BOOKING_STATUSES.contains(reservation.getStatus())) {
            throw new BadRequestException("Reservation is not joinable");
        }
        if (participantRepository.existsByReservationIdAndEmployeeIdAndStatusIn(
                reservationId,
                employee.getId(),
                List.of(ParticipantStatus.JOINED)
        )) {
            throw new BadRequestException("Employee already joined this reservation");
        }
        long currentParticipants = participantRepository.countByReservationIdAndStatus(reservationId, ParticipantStatus.JOINED);
        if (currentParticipants >= reservation.getCar().getCapacity()) {
            throw new BadRequestException("Car capacity exceeded");
        }

        participantRepository.findByReservationIdAndEmployeeId(reservationId, employee.getId())
                .ifPresentOrElse(existing -> existing.setStatus(ParticipantStatus.JOINED), () -> addParticipant(reservation, employee));
        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponse cancel(Long reservationId) {
        Employee employee = currentEmployeeService.getCurrentEmployee();
        Reservation reservation = findReservation(reservationId);

        if (!reservation.getCreatedBy().getId().equals(employee.getId())) {
            participantRepository.findByReservationIdAndEmployeeId(reservationId, employee.getId())
                    .ifPresentOrElse(
                            participant -> participant.setStatus(ParticipantStatus.CANCELLED),
                            () -> {
                                throw new BadRequestException("Employee is not part of this reservation");
                            }
                    );
            return toResponse(reservation);
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponse complete(Long reservationId) {
        Employee employee = currentEmployeeService.getCurrentEmployee();
        Reservation reservation = findReservation(reservationId);
        if (!reservation.getCreatedBy().getId().equals(employee.getId())) {
            throw new BadRequestException("Only the creator can complete this reservation");
        }
        reservation.setStatus(ReservationStatus.COMPLETED);
        return toResponse(reservation);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> myReservations() {
        Employee employee = currentEmployeeService.getCurrentEmployee();
        return participantRepository.findByEmployeeIdOrderByJoinedAtDesc(employee.getId()).stream()
                .map(RideParticipant::getReservation)
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> companyAvailableRides() {
        Employee employee = currentEmployeeService.getCurrentEmployee();
        return reservationRepository.findByCompanyIdAndStatusInOrderByStartTimeAsc(
                        employee.getCompany().getId(),
                        ACTIVE_BOOKING_STATUSES
                ).stream()
                .filter(reservation -> participantRepository.countByReservationIdAndStatus(reservation.getId(), ParticipantStatus.JOINED)
                        < reservation.getCar().getCapacity())
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReservationResponse findById(Long id) {
        return toResponse(findReservation(id));
    }

    private Reservation findReservation(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reservation not found"));
    }

    private void addParticipant(Reservation reservation, Employee employee) {
        RideParticipant participant = new RideParticipant();
        participant.setReservation(reservation);
        participant.setEmployee(employee);
        participant.setStatus(ParticipantStatus.JOINED);
        participantRepository.save(participant);
    }

    private ReservationResponse toResponse(Reservation reservation) {
        long participants = participantRepository.countByReservationIdAndStatus(reservation.getId(), ParticipantStatus.JOINED);
        return ReservationResponse.from(reservation, participants);
    }
}
