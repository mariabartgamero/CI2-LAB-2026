package com.ci2lab.carsharing.service;

import com.ci2lab.carsharing.dto.CreateIncidenciaRequest;
import com.ci2lab.carsharing.dto.IncidenciaResponse;
import com.ci2lab.carsharing.exception.AppException;
import com.ci2lab.carsharing.model.Car;
import com.ci2lab.carsharing.model.EstadoIncidencia;
import com.ci2lab.carsharing.model.Incidencia;
import com.ci2lab.carsharing.model.PrioridadIncidencia;
import com.ci2lab.carsharing.model.Reservation;
import com.ci2lab.carsharing.model.TipoIncidencia;
import com.ci2lab.carsharing.model.User;
import com.ci2lab.carsharing.repository.CarRepository;
import com.ci2lab.carsharing.repository.IncidenciaRepository;
import com.ci2lab.carsharing.repository.ReservationRepository;
import com.ci2lab.carsharing.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IncidenciaService {
    private final IncidenciaRepository incidenciaRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final CarRepository carRepository;

    public IncidenciaService(
            IncidenciaRepository incidenciaRepository,
            UserRepository userRepository,
            ReservationRepository reservationRepository,
            CarRepository carRepository
    ) {
        this.incidenciaRepository = incidenciaRepository;
        this.userRepository = userRepository;
        this.reservationRepository = reservationRepository;
        this.carRepository = carRepository;
    }

    @Transactional
    public IncidenciaResponse create(CreateIncidenciaRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new AppException("Usuario no encontrado"));
        validateCategoryForType(request);

        Incidencia incidencia = new Incidencia();
        incidencia.setUsuario(user);
        incidencia.setReserva(findReservation(request.reservationId()));
        incidencia.setCoche(findCar(request.carId()));
        incidencia.setCategoria(request.categoria());
        incidencia.setTipoIncidencia(request.tipoIncidencia());
        incidencia.setDescripcion(request.descripcion().trim());
        incidencia.setEstado(EstadoIncidencia.ABIERTA);
        incidencia.setPrioridad(priorityFor(request.tipoIncidencia()));

        return IncidenciaResponse.from(incidenciaRepository.save(incidencia));
    }

    @Transactional(readOnly = true)
    public List<IncidenciaResponse> findAll() {
        return incidenciaRepository.findAllByOrderByFechaCreacionDesc().stream()
                .map(IncidenciaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncidenciaResponse> findByUser(Long userId) {
        return incidenciaRepository.findByUsuarioIdOrderByFechaCreacionDesc(userId).stream()
                .map(IncidenciaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public IncidenciaResponse findById(Long id) {
        return IncidenciaResponse.from(findIncidencia(id));
    }

    @Transactional
    public IncidenciaResponse updateEstado(Long id, EstadoIncidencia estado) {
        Incidencia incidencia = findIncidencia(id);
        incidencia.setEstado(estado);
        incidencia.setFechaActualizacion(LocalDateTime.now());
        return IncidenciaResponse.from(incidencia);
    }

    @Transactional
    public void delete(Long id) {
        if (!incidenciaRepository.existsById(id)) {
            throw new AppException("Incidencia no encontrada");
        }
        incidenciaRepository.deleteById(id);
    }

    private void validateCategoryForType(CreateIncidenciaRequest request) {
        if (request.tipoIncidencia().getCategoria() != request.categoria()) {
            throw new AppException("El tipo de incidencia no pertenece a la categoria indicada");
        }
    }

    private Reservation findReservation(Long reservationId) {
        if (reservationId == null) return null;
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException("Reserva no encontrada"));
    }

    private Car findCar(Long carId) {
        if (carId == null) return null;
        return carRepository.findById(carId)
                .orElseThrow(() -> new AppException("Coche no encontrado"));
    }

    private Incidencia findIncidencia(Long id) {
        return incidenciaRepository.findById(id)
                .orElseThrow(() -> new AppException("Incidencia no encontrada"));
    }

    private PrioridadIncidencia priorityFor(TipoIncidencia tipo) {
        return switch (tipo) {
            case ACCIDENTE, COCHE_ROBADO, ASISTENCIA_URGENTE, AVERIA_DURANTE_TRAYECTO, DANOS_GRAVES ->
                    PrioridadIncidencia.URGENTE;
            case COCHE_NO_ARRANCA, COCHE_NO_ABRE, COCHE_NO_CIERRA,
                    NO_PUEDO_INICIAR_RESERVA, NO_PUEDO_FINALIZAR_RESERVA ->
                    PrioridadIncidencia.ALTA;
            case COCHE_SUCIO, DANOS_VISIBLES, UBICACION_COCHE_NO_COINCIDE,
                    RESERVA_SIGUE_ACTIVA, POCA_BATERIA_O_COMBUSTIBLE, COCHE_NO_ESTA_EN_UBICACION ->
                    PrioridadIncidencia.MEDIA;
            case OBJETO_PERDIDO, OBJETO_ENCONTRADO, RECUPERAR_OBJETO, INFORMAR_OBJETO,
                    CONSULTA_GENERAL, PROBLEMA_NO_ESPECIFICADO, OTRO ->
                    PrioridadIncidencia.BAJA;
            default -> PrioridadIncidencia.MEDIA;
        };
    }
}
