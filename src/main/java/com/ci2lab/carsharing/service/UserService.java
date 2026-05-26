package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.dto.UserResponse;
import com.ci2lab.carsharing.exception.AppException;
import com.ci2lab.carsharing.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final ReservationService reservationService;

    public UserService(UserRepository userRepository, ReservationService reservationService) {
        this.userRepository = userRepository;
        this.reservationService = reservationService;
    }

    @Transactional
    public UserResponse findById(Long id) {
        reservationService.completeExpiredReservations();
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new AppException("Usuario no encontrado"));
    }
}
