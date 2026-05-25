package com.ci2lab.carsharing.repository;

import com.ci2lab.carsharing.model.Employee;
import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.ReservationStatus;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    @Query("""
            select count(r) > 0
            from Reservation r
            where r.car.id = :carId
              and r.status in :statuses
              and r.startTime < :endTime
              and r.endTime > :startTime
            """)
    boolean existsOverlappingReservation(
            @Param("carId") Long carId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") Collection<ReservationStatus> statuses
    );

    List<Reservation> findByCreatedByOrderByStartTimeDesc(Employee employee);

    List<Reservation> findByCompanyIdAndStatusInOrderByStartTimeAsc(Long companyId, Collection<ReservationStatus> statuses);
}
