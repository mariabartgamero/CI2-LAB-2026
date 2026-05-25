package com.ci2lab.carsharing.controller;

import com.ci2lab.carsharing.dto.CarMapResponse;
import com.ci2lab.carsharing.service.CarService;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/cars")
public class CarController {
    private final CarService carService;

    public CarController(CarService carService) {
        this.carService = carService;
    }

    @GetMapping
    public List<CarMapResponse> findAll() {
        return carService.findAll();
    }

    @GetMapping("/available")
    public List<CarMapResponse> findAvailable() {
        return carService.findAvailable();
    }

    @GetMapping("/visible")
    public List<CarMapResponse> findVisible(@RequestParam Long userId) {
        return carService.findVisibleForUser(userId);
    }
}
