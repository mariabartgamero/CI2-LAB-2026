package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.Company;

public record CompanyResponse(Long id, String nombre, String codigoEmpresa) {
    public static CompanyResponse from(Company company) {
        return new CompanyResponse(company.getId(), company.getNombre(), company.getCodigoEmpresa());
    }
}
