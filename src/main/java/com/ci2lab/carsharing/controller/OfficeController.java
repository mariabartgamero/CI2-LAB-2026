package com.ci2lab.carsharing.controller;

import com.ci2lab.carsharing.dto.OfficeResponse;
import com.ci2lab.carsharing.service.CompanyService;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/offices")
public class OfficeController {
    private final CompanyService companyService;

    public OfficeController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping("/company/{companyId}")
    public List<OfficeResponse> findByCompany(@PathVariable Long companyId) {
        return companyService.findOfficesByCompany(companyId);
    }
}
