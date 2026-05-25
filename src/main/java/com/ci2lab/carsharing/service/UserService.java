package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.dto.UserResponse;
import com.ci2lab.carsharing.exception.AppException;
import com.ci2lab.carsharing.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new AppException("Usuario no encontrado"));
    }
}
