package com.ci2lab.carsharing.repository;

import com.ci2lab.carsharing.model.ParticipantStatus;
import com.ci2lab.carsharing.model.ReservationParticipant;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationParticipantRepository extends JpaRepository<ReservationParticipant, Long> {
    @EntityGraph(attributePaths = {"reservation", "reservation.coche", "reservation.empresa", "reservation.usuarioCreador", "reservation.usuariosApuntados", "reservation.destino", "user"})
    List<ReservationParticipant> findByUserIdOrderByReservationHoraSalidaDesc(Long userId);

    Optional<ReservationParticipant> findFirstByReservationIdAndUserId(Long reservationId, Long userId);

    Optional<ReservationParticipant> findFirstByReservationIdAndUserIdAndStatus(
            Long reservationId,
            Long userId,
            ParticipantStatus status
    );
}
