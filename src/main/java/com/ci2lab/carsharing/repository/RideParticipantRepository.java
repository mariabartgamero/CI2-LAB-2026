package com.ci2lab.carsharing.repository;

import com.ci2lab.carsharing.model.ParticipantStatus;
import com.ci2lab.carsharing.model.RideParticipant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RideParticipantRepository extends JpaRepository<RideParticipant, Long> {
    long countByReservationIdAndStatus(Long reservationId, ParticipantStatus status);

    boolean existsByReservationIdAndEmployeeIdAndStatusIn(
            Long reservationId,
            Long employeeId,
            Collection<ParticipantStatus> statuses
    );

    Optional<RideParticipant> findByReservationIdAndEmployeeId(Long reservationId, Long employeeId);

    List<RideParticipant> findByEmployeeIdOrderByJoinedAtDesc(Long employeeId);
}
