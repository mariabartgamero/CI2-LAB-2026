package com.ci2lab.carsharing.dto;

import com.ci2lab.carsharing.model.ReservationParticipant;
import com.ci2lab.carsharing.model.User;

public record OccupantResponse(Long id, String nombre, boolean ready) {
    public static OccupantResponse from(User user) {
        return new OccupantResponse(user.getId(), user.getNombre(), false);
    }

    public static OccupantResponse from(ReservationParticipant participant) {
        User user = participant.getUser();
        return new OccupantResponse(user.getId(), user.getNombre(), participant.isReady());
    }
}
