package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.User;

public record OccupantResponse(Long id, String nombre) {
    public static OccupantResponse from(User user) {
        return new OccupantResponse(user.getId(), user.getNombre());
    }
}
