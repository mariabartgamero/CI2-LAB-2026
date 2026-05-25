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
import jakarta.persistence.Table;
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

    @Column(nullable = false)
    private LocalDateTime horaSalida;

    @Column(nullable = false)
    private double origenLatitud;

    @Column(nullable = false)
    private double origenLongitud;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "office_id")
    private Office destino;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus estado = ReservationStatus.PENDIENTE;

    @Column(nullable = false)
    private int plazasOcupadas = 1;

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

    public LocalDateTime getHoraSalida() {
        return horaSalida;
    }

    public void setHoraSalida(LocalDateTime horaSalida) {
        this.horaSalida = horaSalida;
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

    public ReservationStatus getEstado() {
        return estado;
    }

    public void setEstado(ReservationStatus estado) {
        this.estado = estado;
    }

    public int getPlazasOcupadas() {
        return plazasOcupadas;
    }

    public void setPlazasOcupadas(int plazasOcupadas) {
        this.plazasOcupadas = plazasOcupadas;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
}
