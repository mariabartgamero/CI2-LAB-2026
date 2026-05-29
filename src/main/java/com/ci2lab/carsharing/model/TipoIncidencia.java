package com.ci2lab.carsharing.model;

public enum TipoIncidencia {
    NO_PUEDO_INICIAR_RESERVA(CategoriaIncidencia.RESERVA),
    NO_PUEDO_FINALIZAR_RESERVA(CategoriaIncidencia.RESERVA),
    RESERVA_SIGUE_ACTIVA(CategoriaIncidencia.RESERVA),
    NO_APARECE_RESERVA(CategoriaIncidencia.RESERVA),
    COCHE_RESERVADO_NO_DISPONIBLE(CategoriaIncidencia.RESERVA),
    UBICACION_COCHE_NO_COINCIDE(CategoriaIncidencia.RESERVA),
    CANCELAR_RESERVA(CategoriaIncidencia.RESERVA),
    MODIFICAR_RESERVA(CategoriaIncidencia.RESERVA),

    COCHE_NO_ARRANCA(CategoriaIncidencia.COCHE),
    COCHE_NO_ABRE(CategoriaIncidencia.COCHE),
    COCHE_NO_CIERRA(CategoriaIncidencia.COCHE),
    COCHE_SUCIO(CategoriaIncidencia.COCHE),
    DANOS_VISIBLES(CategoriaIncidencia.COCHE),
    POCA_BATERIA_O_COMBUSTIBLE(CategoriaIncidencia.COCHE),
    LUZ_AVISO_ENCENDIDA(CategoriaIncidencia.COCHE),
    RUIDO_EXTRANO(CategoriaIncidencia.COCHE),
    COCHE_NO_ESTA_EN_UBICACION(CategoriaIncidencia.COCHE),
    OTRO_PROBLEMA_COCHE(CategoriaIncidencia.COCHE),

    ACCIDENTE(CategoriaIncidencia.ACCIDENTE_EMERGENCIA),
    AVERIA_DURANTE_TRAYECTO(CategoriaIncidencia.ACCIDENTE_EMERGENCIA),
    DANOS_GRAVES(CategoriaIncidencia.ACCIDENTE_EMERGENCIA),
    USUARIO_BLOQUEADO(CategoriaIncidencia.ACCIDENTE_EMERGENCIA),
    COCHE_ROBADO(CategoriaIncidencia.ACCIDENTE_EMERGENCIA),
    ASISTENCIA_URGENTE(CategoriaIncidencia.ACCIDENTE_EMERGENCIA),

    OBJETO_PERDIDO(CategoriaIncidencia.OBJETO_PERDIDO),
    OBJETO_ENCONTRADO(CategoriaIncidencia.OBJETO_PERDIDO),
    RECUPERAR_OBJETO(CategoriaIncidencia.OBJETO_PERDIDO),
    INFORMAR_OBJETO(CategoriaIncidencia.OBJETO_PERDIDO),

    CONSULTA_GENERAL(CategoriaIncidencia.OTRO),
    PROBLEMA_NO_ESPECIFICADO(CategoriaIncidencia.OTRO),
    OTRO(CategoriaIncidencia.OTRO);

    private final CategoriaIncidencia categoria;

    TipoIncidencia(CategoriaIncidencia categoria) {
        this.categoria = categoria;
    }

    public CategoriaIncidencia getCategoria() {
        return categoria;
    }
}
