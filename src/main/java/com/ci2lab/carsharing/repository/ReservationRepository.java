package com.ci2lab.carsharing.repository;

import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.ReservationStatus;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    Optional<Reservation> findFirstByCocheIdAndEstadoIn(Long carId, Collection<ReservationStatus> statuses);

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByEmpresaIdAndEstadoIn(Long companyId, Collection<ReservationStatus> statuses);

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByUsuarioCreadorIdOrderByHoraSalidaDesc(Long userId);

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    Optional<Reservation> findFirstByUsuarioCreadorIdAndEstado(Long userId, ReservationStatus status);

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    Optional<Reservation> findFirstByUsuariosApuntadosIdAndEstado(Long userId, ReservationStatus status);

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByUsuariosApuntadosIdOrderByHoraSalidaDesc(Long userId);

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByEstadoAndHoraEstimadaLlegadaLessThanEqual(ReservationStatus status, LocalDateTime now);

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByEstadoAndHoraSalidaLessThanEqualAndHoraEstimadaLlegadaAfter(
            ReservationStatus status,
            LocalDateTime now,
            LocalDateTime sameNow
    );

    @Query("""
            select count(r) > 0
            from Reservation r
            join r.usuariosApuntados u
            where u.id = :userId
              and r.estado in :statuses
              and r.horaSalida >= :startOfDay
              and r.horaSalida < :startOfNextDay
            """)
    boolean existsCountedReservationForUserOnDay(
            @Param("userId") Long userId,
            @Param("statuses") Collection<ReservationStatus> statuses,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("startOfNextDay") LocalDateTime startOfNextDay
    );
}
