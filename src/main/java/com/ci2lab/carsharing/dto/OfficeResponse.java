package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.Office;

public record OfficeResponse(
        Long id,
        String nombre,
        String direccion,
        double latitud,
        double longitud,
        Long empresaId
) {
    public static OfficeResponse from(Office office) {
        return new OfficeResponse(
                office.getId(),
                office.getNombre(),
                office.getDireccion(),
                office.getLatitud(),
                office.getLongitud(),
                office.getEmpresa().getId()
        );
    }
}
