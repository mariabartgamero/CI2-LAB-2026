package com.ci2lab.carsharing.controller;

import com.ci2lab.carsharing.dto.AuthResponse;
import com.ci2lab.carsharing.dto.EmployeeResponse;
import com.ci2lab.carsharing.dto.LoginRequest;
import com.ci2lab.carsharing.dto.RegisterRequest;
import com.ci2lab.carsharing.service.AuthService;
import com.ci2lab.carsharing.service.CurrentEmployeeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final CurrentEmployeeService currentEmployeeService;

    public AuthController(AuthService authService, CurrentEmployeeService currentEmployeeService) {
        this.authService = authService;
        this.currentEmployeeService = currentEmployeeService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public EmployeeResponse me() {
        return EmployeeResponse.from(currentEmployeeService.getCurrentEmployee());
    }
}
