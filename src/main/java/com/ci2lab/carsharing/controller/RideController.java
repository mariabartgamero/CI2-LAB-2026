package com.ci2lab.carsharing.controller;

import com.ci2lab.carsharing.dto.ReservationResponse;
import com.ci2lab.carsharing.service.ReservationService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rides")
public class RideController {
    private final ReservationService reservationService;

    public RideController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping("/company/available")
    public List<ReservationResponse> companyAvailableRides() {
        return reservationService.companyAvailableRides();
    }
}
