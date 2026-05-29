package com.ci2lab.carsharing.repository;

import com.ci2lab.carsharing.model.Incidencia;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidenciaRepository extends JpaRepository<Incidencia, Long> {
    @EntityGraph(attributePaths = {"usuario", "reserva", "coche"})
    List<Incidencia> findAllByOrderByFechaCreacionDesc();

    @EntityGraph(attributePaths = {"usuario", "reserva", "coche"})
    List<Incidencia> findByUsuarioIdOrderByFechaCreacionDesc(Long userId);
}
