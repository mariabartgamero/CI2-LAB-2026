package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.model.Employee;
import com.ci2lab.carsharing.security.EmployeePrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentEmployeeService {
    public Employee getCurrentEmployee() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof EmployeePrincipal principal)) {
            throw new IllegalStateException("No authenticated employee");
        }
        return principal.getEmployee();
    }
}
