package com.ci2lab.carsharing.controller;

import com.ci2lab.carsharing.dto.CreateReservationRequest;
import com.ci2lab.carsharing.dto.RatingRequest;
import com.ci2lab.carsharing.dto.ReservationResponse;
import com.ci2lab.carsharing.dto.UserActionRequest;
import com.ci2lab.carsharing.service.ReservationService;
import jakarta.validation.Valid;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ReservationResponse create(@Valid @RequestBody CreateReservationRequest request) {
        return reservationService.create(request);
    }

    @PostMapping("/{id}/join")
    public ReservationResponse join(@PathVariable Long id, @Valid @RequestBody UserActionRequest request) {
        return reservationService.join(id, request.userId());
    }

    @PostMapping("/{id}/start")
    public ReservationResponse start(@PathVariable Long id, @Valid @RequestBody UserActionRequest request) {
        return reservationService.start(id, request.userId());
    }

    @PostMapping("/{id}/ready")
    public ReservationResponse ready(@PathVariable Long id, @Valid @RequestBody UserActionRequest request) {
        return reservationService.ready(id, request.userId());
    }

    @PostMapping("/{id}/finish")
    public ReservationResponse finish(@PathVariable Long id, @Valid @RequestBody UserActionRequest request) {
        return reservationService.finish(id, request.userId());
    }

    @PostMapping("/{id}/cancel")
    public ReservationResponse cancel(@PathVariable Long id, @Valid @RequestBody UserActionRequest request) {
        return reservationService.cancel(id, request.userId());
    }

    @PatchMapping("/{id}/rating")
    public ReservationResponse rate(@PathVariable Long id, @Valid @RequestBody RatingRequest request) {
        return reservationService.rate(id, request.userId(), request.rating());
    }

    @GetMapping("/user/{userId}/active")
    public ReservationResponse findActiveByUser(@PathVariable Long userId) {
        return reservationService.findActiveByUser(userId);
    }

    @GetMapping("/user/{userId}")
    public List<ReservationResponse> findByUser(@PathVariable Long userId) {
        return reservationService.findByUser(userId);
    }
}
