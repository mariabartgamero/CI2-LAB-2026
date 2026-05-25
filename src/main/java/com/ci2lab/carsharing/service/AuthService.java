package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.dto.AuthResponse;
import com.ci2lab.carsharing.dto.EmployeeResponse;
import com.ci2lab.carsharing.dto.LoginRequest;
import com.ci2lab.carsharing.dto.RegisterRequest;
import com.ci2lab.carsharing.exception.BadRequestException;
import com.ci2lab.carsharing.model.Company;
import com.ci2lab.carsharing.model.Employee;
import com.ci2lab.carsharing.repository.CompanyRepository;
import com.ci2lab.carsharing.repository.EmployeeRepository;
import com.ci2lab.carsharing.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            EmployeeRepository employeeRepository,
            CompanyRepository companyRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.employeeRepository = employeeRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (employeeRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("Email already registered");
        }

        Company company = resolveCompany(request);
        Employee employee = new Employee();
        employee.setName(request.name());
        employee.setEmail(request.email().toLowerCase());
        employee.setPasswordHash(passwordEncoder.encode(request.password()));
        employee.setCompany(company);

        Employee saved = employeeRepository.save(employee);
        return new AuthResponse(jwtService.generateToken(saved.getEmail()), EmployeeResponse.from(saved));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        Employee employee = employeeRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));
        return new AuthResponse(jwtService.generateToken(employee.getEmail()), EmployeeResponse.from(employee));
    }

    private Company resolveCompany(RegisterRequest request) {
        if (request.companyId() != null) {
            return companyRepository.findById(request.companyId())
                    .orElseThrow(() -> new BadRequestException("Company not found"));
        }
        if (request.companyName() == null || request.companyName().isBlank()) {
            throw new BadRequestException("companyId or companyName is required");
        }
        return companyRepository.findByNameIgnoreCase(request.companyName())
                .orElseGet(() -> {
                    Company company = new Company();
                    company.setName(request.companyName());
                    return companyRepository.save(company);
                });
    }
}
