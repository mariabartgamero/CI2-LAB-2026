package com.ci2lab.carsharing.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.CascadeType;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reservations")
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "car_id")
    private Car coche;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id")
    private Company empresa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_user_id")
    private User usuarioCreador;

    @ManyToMany
    @JoinTable(
            name = "reservation_users",
            joinColumns = @JoinColumn(name = "reservation_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> usuariosApuntados = new ArrayList<>();

    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL)
    private List<ReservationParticipant> participantes = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime horaSalida;

    @Column(nullable = false)
    private LocalDateTime horaEstimadaLlegada;

    @Column(nullable = false)
    private double origenLatitud;

    @Column(nullable = false)
    private double origenLongitud;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "office_id", nullable = true)
    private Office destino;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_trayecto")
    private ReservationTripType tipoTrayecto = ReservationTripType.IDA;

    private String destinoNombre;

    private String destinoDireccion;

    private Double destinoLatitud;

    private Double destinoLongitud;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus estado = ReservationStatus.ACTIVE;

    @Column(nullable = false)
    private int puntosPrevistos;

    @Column(nullable = false)
    private int plazasOcupadas = 1;

    @Column(nullable = false)
    private boolean puntosAsignados = false;

    @Column(name = "trayecto_iniciado")
    private Boolean trayectoIniciado = false;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public Car getCoche() {
        return coche;
    }

    public void setCoche(Car coche) {
        this.coche = coche;
    }

    public Company getEmpresa() {
        return empresa;
    }

    public void setEmpresa(Company empresa) {
        this.empresa = empresa;
    }

    public User getUsuarioCreador() {
        return usuarioCreador;
    }

    public void setUsuarioCreador(User usuarioCreador) {
        this.usuarioCreador = usuarioCreador;
    }

    public List<User> getUsuariosApuntados() {
        return usuariosApuntados;
    }

    public void setUsuariosApuntados(List<User> usuariosApuntados) {
        this.usuariosApuntados = usuariosApuntados;
    }

    public List<ReservationParticipant> getParticipantes() {
        return participantes;
    }

    public void setParticipantes(List<ReservationParticipant> participantes) {
        this.participantes = participantes;
    }

    public LocalDateTime getHoraSalida() {
        return horaSalida;
    }

    public void setHoraSalida(LocalDateTime horaSalida) {
        this.horaSalida = horaSalida;
    }

    public LocalDateTime getHoraEstimadaLlegada() {
        return horaEstimadaLlegada;
    }

    public void setHoraEstimadaLlegada(LocalDateTime horaEstimadaLlegada) {
        this.horaEstimadaLlegada = horaEstimadaLlegada;
    }

    public double getOrigenLatitud() {
        return origenLatitud;
    }

    public void setOrigenLatitud(double origenLatitud) {
        this.origenLatitud = origenLatitud;
    }

    public double getOrigenLongitud() {
        return origenLongitud;
    }

    public void setOrigenLongitud(double origenLongitud) {
        this.origenLongitud = origenLongitud;
    }

    public Office getDestino() {
        return destino;
    }

    public void setDestino(Office destino) {
        this.destino = destino;
    }

    public ReservationTripType getTipoTrayecto() {
        return tipoTrayecto == null ? ReservationTripType.IDA : tipoTrayecto;
    }

    public void setTipoTrayecto(ReservationTripType tipoTrayecto) {
        this.tipoTrayecto = tipoTrayecto == null ? ReservationTripType.IDA : tipoTrayecto;
    }

    public String getDestinoNombre() {
        if (destinoNombre != null && !destinoNombre.isBlank()) {
            return destinoNombre;
        }
        return destino == null ? null : destino.getNombre();
    }

    public void setDestinoNombre(String destinoNombre) {
        this.destinoNombre = destinoNombre;
    }

    public String getDestinoDireccion() {
        if (destinoDireccion != null && !destinoDireccion.isBlank()) {
            return destinoDireccion;
        }
        return destino == null ? null : destino.getDireccion();
    }

    public void setDestinoDireccion(String destinoDireccion) {
        this.destinoDireccion = destinoDireccion;
    }

    public Double getDestinoLatitud() {
        if (destinoLatitud != null) {
            return destinoLatitud;
        }
        return destino == null ? null : destino.getLatitud();
    }

    public void setDestinoLatitud(Double destinoLatitud) {
        this.destinoLatitud = destinoLatitud;
    }

    public Double getDestinoLongitud() {
        if (destinoLongitud != null) {
            return destinoLongitud;
        }
        return destino == null ? null : destino.getLongitud();
    }

    public void setDestinoLongitud(Double destinoLongitud) {
        this.destinoLongitud = destinoLongitud;
    }

    public ReservationStatus getEstado() {
        return estado;
    }

    public void setEstado(ReservationStatus estado) {
        this.estado = estado;
    }

    public int getPuntosPrevistos() {
        return puntosPrevistos;
    }

    public void setPuntosPrevistos(int puntosPrevistos) {
        this.puntosPrevistos = puntosPrevistos;
    }

    public int getPlazasOcupadas() {
        return plazasOcupadas;
    }

    public void setPlazasOcupadas(int plazasOcupadas) {
        this.plazasOcupadas = plazasOcupadas;
    }

    public boolean isPuntosAsignados() {
        return puntosAsignados;
    }

    public void setPuntosAsignados(boolean puntosAsignados) {
        this.puntosAsignados = puntosAsignados;
    }

    public boolean isTrayectoIniciado() {
        return Boolean.TRUE.equals(trayectoIniciado);
    }

    public void setTrayectoIniciado(boolean trayectoIniciado) {
        this.trayectoIniciado = trayectoIniciado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
}
