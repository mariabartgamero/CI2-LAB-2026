package com.ci2lab.carsharing.repository;

import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.ReservationStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    Optional<Reservation> findFirstByCocheIdAndEstadoIn(Long carId, Collection<ReservationStatus> statuses);

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByEmpresaIdAndEstadoIn(Long companyId, Collection<ReservationStatus> statuses);

    @EntityGraph(attributePaths = {"coche", "empresa", "usuarioCreador", "usuariosApuntados", "destino"})
    List<Reservation> findByUsuariosApuntadosIdOrderByHoraSalidaDesc(Long userId);
}
