package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.dto.CompanyResponse;
import com.ci2lab.carsharing.dto.OfficeResponse;
import com.ci2lab.carsharing.repository.CompanyRepository;
import com.ci2lab.carsharing.repository.OfficeRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyService {
    private final CompanyRepository companyRepository;
    private final OfficeRepository officeRepository;

    public CompanyService(CompanyRepository companyRepository, OfficeRepository officeRepository) {
        this.companyRepository = companyRepository;
        this.officeRepository = officeRepository;
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> findAll() {
        return companyRepository.findAll().stream().map(CompanyResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<OfficeResponse> findOfficesByCompany(Long companyId) {
        return officeRepository.findByEmpresaId(companyId).stream().map(OfficeResponse::from).toList();
    }
}
