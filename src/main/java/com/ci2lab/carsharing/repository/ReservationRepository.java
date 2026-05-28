package com.ci2lab.carsharing.repository;

import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.ReservationStatus;
import com.ci2lab.carsharing.model.ReservationTripType;
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
    Optional<Reservation> findFirstByUsuariosApuntadosIdAndEstadoIn(Long userId, Collection<ReservationStatus> statuses);

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByUsuariosApuntadosIdOrderByHoraSalidaDesc(Long userId);

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByEstadoAndHoraEstimadaLlegadaLessThanEqual(ReservationStatus status, LocalDateTime now);

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByEstadoInAndHoraEstimadaLlegadaLessThanEqual(
            Collection<ReservationStatus> statuses,
            LocalDateTime now
    );

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByEstadoAndTrayectoIniciadoTrueAndHoraEstimadaLlegadaLessThanEqual(
            ReservationStatus status,
            LocalDateTime now
    );

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    @Query("""
            select r
            from Reservation r
            where r.estado = :status
              and (r.trayectoIniciado = false or r.trayectoIniciado is null)
              and r.horaSalida < :cutoff
            """)
    List<Reservation> findPendingReservationsToExpire(
            @Param("status") ReservationStatus status,
            @Param("cutoff") LocalDateTime cutoff
    );

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    @Query("""
            select r
            from Reservation r
            where r.estado = :status
              and (r.trayectoIniciado = false or r.trayectoIniciado is null)
              and r.horaSalida <= :now
            """)
    List<Reservation> findPendingReservationsToStart(
            @Param("status") ReservationStatus status,
            @Param("now") LocalDateTime now
    );

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByEstadoAndHoraSalidaLessThanEqualAndHoraEstimadaLlegadaAfter(
            ReservationStatus status,
            LocalDateTime now,
            LocalDateTime sameNow
    );

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByEstadoInAndHoraSalidaLessThanEqualAndHoraEstimadaLlegadaAfter(
            Collection<ReservationStatus> statuses,
            LocalDateTime now,
            LocalDateTime sameNow
    );

    @Query("""
            select count(r) > 0
            from Reservation r
            join r.usuariosApuntados u
            where u.id = :userId
              and r.estado in :statuses
              and (
                    (:tipoTrayecto = com.ci2lab.carsharing.model.ReservationTripType.IDA
                        and (r.tipoTrayecto is null or r.tipoTrayecto = :tipoTrayecto))
                    or (:tipoTrayecto <> com.ci2lab.carsharing.model.ReservationTripType.IDA
                        and r.tipoTrayecto = :tipoTrayecto)
              )
              and r.horaSalida >= :startOfDay
              and r.horaSalida < :startOfNextDay
            """)
    boolean existsCountedReservationForUserOnDayAndType(
            @Param("userId") Long userId,
            @Param("statuses") Collection<ReservationStatus> statuses,
            @Param("tipoTrayecto") ReservationTripType tipoTrayecto,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("startOfNextDay") LocalDateTime startOfNextDay
    );
}
