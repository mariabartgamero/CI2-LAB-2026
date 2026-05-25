package com.ci2lab.carsharing.controller;

import com.ci2lab.carsharing.dto.AuthRequest;
import com.ci2lab.carsharing.dto.RegisterRequest;
import com.ci2lab.carsharing.dto.UserResponse;
import com.ci2lab.carsharing.service.AuthService;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody AuthRequest request) {
        return authService.login(request);
    }
}
