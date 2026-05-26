package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.dto.AuthRequest;
import com.ci2lab.carsharing.dto.RegisterRequest;
import com.ci2lab.carsharing.dto.UserResponse;
import com.ci2lab.carsharing.exception.AppException;
import com.ci2lab.carsharing.model.Company;
import com.ci2lab.carsharing.model.User;
import com.ci2lab.carsharing.repository.CompanyRepository;
import com.ci2lab.carsharing.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    public AuthService(UserRepository userRepository, CompanyRepository companyRepository) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new AppException("Ya existe un usuario con ese email");
        }
        if (userRepository.existsByDniIgnoreCase(request.dni())) {
            throw new AppException("Ya existe un usuario con ese DNI");
        }

        Company company = companyRepository.findByCodigoEmpresaIgnoreCase(request.codigoEmpresa())
                .orElseThrow(() -> new AppException("EMPRESA INCORRECTA"));

        User user = new User();
        user.setNombre(request.nombre());
        user.setEmail(request.email().toLowerCase());
        user.setPassword(request.password());
        user.setDni(request.dni().toUpperCase());
        user.setEmpresa(company);
        user.setCodigoEmpresa(company.getCodigoEmpresa());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResponse login(AuthRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new AppException("Email o password incorrectos"));
        if (!user.getPassword().equals(request.password())) {
            throw new AppException("Email o password incorrectos");
        }
        return UserResponse.from(user);
    }
}
