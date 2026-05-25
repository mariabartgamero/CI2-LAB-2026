package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.User;

public record UserResponse(
        Long id,
        String nombre,
        String email,
        String dni,
        Long empresaId,
        String empresaNombre,
        String codigoEmpresa,
        int puntosResponsables
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getNombre(),
                user.getEmail(),
                user.getDni(),
                user.getEmpresa().getId(),
                user.getEmpresa().getNombre(),
                user.getCodigoEmpresa(),
                user.getPuntosResponsables()
        );
    }
}
