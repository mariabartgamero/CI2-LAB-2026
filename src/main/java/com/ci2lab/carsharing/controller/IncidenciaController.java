package com.ci2lab.carsharing.controller;

import com.ci2lab.carsharing.dto.CreateIncidenciaRequest;
import com.ci2lab.carsharing.dto.IncidenciaResponse;
import com.ci2lab.carsharing.dto.UpdateIncidenciaEstadoRequest;
import com.ci2lab.carsharing.service.IncidenciaService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/incidencias")
public class IncidenciaController {
    private final IncidenciaService incidenciaService;

    public IncidenciaController(IncidenciaService incidenciaService) {
        this.incidenciaService = incidenciaService;
    }

    @PostMapping
    public IncidenciaResponse create(@Valid @RequestBody CreateIncidenciaRequest request) {
        return incidenciaService.create(request);
    }

    @GetMapping
    public List<IncidenciaResponse> findAll() {
        return incidenciaService.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<IncidenciaResponse> findByUser(@PathVariable Long userId) {
        return incidenciaService.findByUser(userId);
    }

    @GetMapping("/{id}")
    public IncidenciaResponse findById(@PathVariable Long id) {
        return incidenciaService.findById(id);
    }

    @PatchMapping("/{id}/estado")
    public IncidenciaResponse updateEstado(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIncidenciaEstadoRequest request
    ) {
        return incidenciaService.updateEstado(id, request.estado());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        incidenciaService.delete(id);
    }
}
