package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.dto.CompanyRequest;
import com.ci2lab.carsharing.dto.CompanyResponse;
import com.ci2lab.carsharing.exception.NotFoundException;
import com.ci2lab.carsharing.model.Company;
import com.ci2lab.carsharing.repository.CompanyRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyService {
    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Transactional
    public CompanyResponse create(CompanyRequest request) {
        Company company = new Company();
        company.setName(request.name());
        company.setDomain(request.domain());
        company.setAddress(request.address());
        company.setLatitude(request.latitude());
        company.setLongitude(request.longitude());
        return CompanyResponse.from(companyRepository.save(company));
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> findAll() {
        return companyRepository.findAll().stream().map(CompanyResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CompanyResponse findById(Long id) {
        return companyRepository.findById(id)
                .map(CompanyResponse::from)
                .orElseThrow(() -> new NotFoundException("Company not found"));
    }
}
