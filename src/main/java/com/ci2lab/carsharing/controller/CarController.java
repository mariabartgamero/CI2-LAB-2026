package com.ci2lab.carsharing.controller;

import com.ci2lab.carsharing.dto.CarResponse;
import com.ci2lab.carsharing.dto.CreateCarRequest;
import com.ci2lab.carsharing.service.CarService;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cars")
public class CarController {
    private final CarService carService;

    public CarController(CarService carService) {
        this.carService = carService;
    }

    @GetMapping("/available")
    public List<CarResponse> findAvailable(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime
    ) {
        return carService.findAvailable(lat, lng, radiusKm, startTime, endTime);
    }

    @PostMapping
    public CarResponse create(@Valid @RequestBody CreateCarRequest request) {
        return carService.create(request);
    }

    @GetMapping("/{id}")
    public CarResponse findById(@PathVariable Long id) {
        return carService.findById(id);
    }
}
