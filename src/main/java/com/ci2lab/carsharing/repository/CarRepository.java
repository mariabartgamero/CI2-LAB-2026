package com.ci2lab.carsharing.repository;

import com.ci2lab.carsharing.model.Car;
import com.ci2lab.carsharing.model.CarStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarRepository extends JpaRepository<Car, Long> {
    List<Car> findByEstado(CarStatus estado);
}
