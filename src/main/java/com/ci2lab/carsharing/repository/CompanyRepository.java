package com.ci2lab.carsharing.repository;

import com.ci2lab.carsharing.model.Company;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByCodigoEmpresaIgnoreCase(String codigoEmpresa);
}
