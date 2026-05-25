package com.ci2lab.carsharing.repository;

import com.ci2lab.carsharing.model.Office;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OfficeRepository extends JpaRepository<Office, Long> {
    List<Office> findByEmpresaId(Long companyId);
}
