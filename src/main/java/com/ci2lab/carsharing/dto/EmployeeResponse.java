package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.Employee;

public record EmployeeResponse(
        Long id,
        String name,
        String email,
        CompanyResponse company
) {
    public static EmployeeResponse from(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getName(),
                employee.getEmail(),
                CompanyResponse.from(employee.getCompany())
        );
    }
}
