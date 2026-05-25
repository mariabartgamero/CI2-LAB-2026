INSERT INTO companies (id, nombre, codigo_empresa) VALUES
    (1, 'Telefonica', 'TEL2026'),
    (2, 'Repsol', 'REP2026'),
    (3, 'Endesa', 'END2026'),
    (4, 'Accenture', 'ACC2026');

INSERT INTO offices (id, nombre, direccion, latitud, longitud, company_id) VALUES
    (1, 'Telefonica Distrito C', 'Ronda de la Comunicacion, Madrid', 40.515120, -3.664000, 1),
    (2, 'Telefonica Gran Via', 'Gran Via 28, Madrid', 40.420220, -3.701730, 1),
    (3, 'Repsol Mendez Alvaro', 'Calle de Mendez Alvaro 44, Madrid', 40.395020, -3.684420, 2),
    (4, 'Repsol Tres Cantos', 'Tres Cantos, Madrid', 40.600810, -3.708010, 2),
    (5, 'Endesa Ribera del Loira', 'Calle Ribera del Loira 60, Madrid', 40.461650, -3.616850, 3),
    (6, 'Endesa Campo de las Naciones', 'Avenida de la Capital de Espana, Madrid', 40.463890, -3.616720, 3),
    (7, 'Accenture Torre Picasso', 'Plaza Pablo Ruiz Picasso, Madrid', 40.450320, -3.692240, 4),
    (8, 'Accenture Castellana', 'Paseo de la Castellana, Madrid', 40.433720, -3.687930, 4);

INSERT INTO app_users (id, nombre, email, user_password, dni, company_id, codigo_empresa, puntos_responsables) VALUES
    (1, 'Ana Lopez', 'ana@telefonica.test', '1234', '11111111A', 1, 'TEL2026', 120),
    (2, 'Carlos Martin', 'carlos@telefonica.test', '1234', '22222222B', 1, 'TEL2026', 80),
    (3, 'Marta Ruiz', 'marta@telefonica.test', '1234', '33333333C', 1, 'TEL2026', 35),
    (4, 'Diego Santos', 'diego@repsol.test', '1234', '44444444D', 2, 'REP2026', 60),
    (5, 'Lucia Perez', 'lucia@repsol.test', '1234', '55555555E', 2, 'REP2026', 90),
    (6, 'Javier Cano', 'javier@repsol.test', '1234', '66666666F', 2, 'REP2026', 30),
    (7, 'Sara Nieto', 'sara@repsol.test', '1234', '77777777G', 2, 'REP2026', 20),
    (8, 'Hugo Molina', 'hugo@repsol.test', '1234', '88888888H', 2, 'REP2026', 10),
    (9, 'Nerea Gil', 'nerea@endesa.test', '1234', '99999999J', 3, 'END2026', 45),
    (10, 'Pablo Vega', 'pablo@accenture.test', '1234', '10101010K', 4, 'ACC2026', 110),
    (11, 'Elena Torres', 'elena@accenture.test', '1234', '12121212L', 4, 'ACC2026', 70);

INSERT INTO cars (id, matricula, bateria, estado, latitud, longitud, plazas_totales) VALUES
    (1, '1001-MDR', 91, 'LIBRE', 40.416775, -3.703790, 5),
    (2, '1002-MDR', 77, 'LIBRE', 40.430120, -3.706650, 5),
    (3, '1003-MDR', 64, 'LIBRE', 40.407390, -3.691910, 5),
    (4, '1004-MDR', 88, 'RESERVA_PENDIENTE', 40.423900, -3.671940, 5),
    (5, '1005-MDR', 72, 'RESERVA_CONFIRMADA', 40.437870, -3.676760, 5),
    (6, '1006-MDR', 53, 'COMPLETO', 40.392280, -3.697670, 5),
    (7, '1007-MDR', 95, 'LIBRE', 40.452110, -3.688960, 5),
    (8, '1008-MDR', 69, 'LIBRE', 40.475170, -3.686440, 5),
    (9, '1009-MDR', 82, 'LIBRE', 40.385060, -3.720350, 5),
    (10, '1010-MDR', 58, 'EN_USO', 40.461650, -3.616850, 5),
    (11, '1011-MDR', 86, 'LIBRE', 40.421620, -3.706260, 5),
    (12, '1012-MDR', 74, 'LIBRE', 40.419220, -3.711560, 5),
    (13, '1013-MDR', 68, 'LIBRE', 40.413110, -3.715820, 5),
    (14, '1014-MDR', 92, 'LIBRE', 40.410210, -3.706910, 5),
    (15, '1015-MDR', 63, 'LIBRE', 40.405760, -3.701420, 5),
    (16, '1016-MDR', 79, 'LIBRE', 40.401920, -3.693860, 5),
    (17, '1017-MDR', 84, 'LIBRE', 40.397510, -3.704180, 5),
    (18, '1018-MDR', 56, 'LIBRE', 40.390780, -3.706740, 5),
    (19, '1019-MDR', 71, 'LIBRE', 40.387360, -3.694910, 5),
    (20, '1020-MDR', 90, 'LIBRE', 40.392940, -3.679950, 5),
    (21, '1021-MDR', 67, 'LIBRE', 40.398890, -3.669380, 5),
    (22, '1022-MDR', 88, 'LIBRE', 40.405120, -3.674340, 5),
    (23, '1023-MDR', 76, 'LIBRE', 40.411860, -3.676460, 5),
    (24, '1024-MDR', 61, 'LIBRE', 40.418460, -3.671120, 5),
    (25, '1025-MDR', 83, 'LIBRE', 40.425820, -3.666820, 5),
    (26, '1026-MDR', 70, 'LIBRE', 40.433280, -3.670950, 5),
    (27, '1027-MDR', 97, 'LIBRE', 40.438740, -3.681610, 5),
    (28, '1028-MDR', 59, 'LIBRE', 40.443920, -3.690680, 5),
    (29, '1029-MDR', 81, 'LIBRE', 40.448210, -3.699810, 5),
    (30, '1030-MDR', 66, 'LIBRE', 40.445650, -3.710880, 5),
    (31, '1031-MDR', 73, 'LIBRE', 40.439520, -3.718730, 5),
    (32, '1032-MDR', 94, 'LIBRE', 40.432580, -3.724360, 5),
    (33, '1033-MDR', 62, 'LIBRE', 40.424940, -3.728140, 5),
    (34, '1034-MDR', 85, 'LIBRE', 40.417220, -3.725280, 5),
    (35, '1035-MDR', 78, 'LIBRE', 40.409820, -3.724720, 5),
    (36, '1036-MDR', 69, 'LIBRE', 40.402620, -3.721220, 5),
    (37, '1037-MDR', 87, 'LIBRE', 40.396640, -3.716220, 5),
    (38, '1038-MDR', 55, 'LIBRE', 40.389420, -3.713060, 5),
    (39, '1039-MDR', 91, 'LIBRE', 40.383940, -3.703710, 5),
    (40, '1040-MDR', 64, 'LIBRE', 40.382620, -3.690420, 5),
    (41, '1041-MDR', 80, 'LIBRE', 40.386820, -3.680180, 5),
    (42, '1042-MDR', 75, 'LIBRE', 40.394150, -3.665960, 5),
    (43, '1043-MDR', 93, 'LIBRE', 40.403850, -3.657980, 5),
    (44, '1044-MDR', 60, 'LIBRE', 40.414420, -3.659480, 5),
    (45, '1045-MDR', 89, 'LIBRE', 40.424120, -3.654870, 5),
    (46, '1046-MDR', 72, 'LIBRE', 40.435640, -3.657460, 5),
    (47, '1047-MDR', 84, 'LIBRE', 40.443320, -3.665420, 5),
    (48, '1048-MDR', 65, 'LIBRE', 40.449020, -3.675620, 5),
    (49, '1049-MDR', 96, 'LIBRE', 40.453920, -3.686460, 5),
    (50, '1050-MDR', 58, 'LIBRE', 40.456520, -3.699460, 5),
    (51, '1051-MDR', 77, 'LIBRE', 40.451180, -3.711900, 5),
    (52, '1052-MDR', 82, 'LIBRE', 40.444420, -3.722220, 5),
    (53, '1053-MDR', 70, 'LIBRE', 40.435220, -3.732120, 5),
    (54, '1054-MDR', 88, 'LIBRE', 40.421480, -3.736720, 5),
    (55, '1055-MDR', 54, 'LIBRE', 40.407920, -3.734220, 5),
    (56, '1056-MDR', 79, 'LIBRE', 40.394820, -3.728620, 5),
    (57, '1057-MDR', 91, 'LIBRE', 40.386580, -3.719180, 5),
    (58, '1058-MDR', 63, 'LIBRE', 40.380980, -3.708180, 5),
    (59, '1059-MDR', 86, 'LIBRE', 40.379860, -3.694280, 5),
    (60, '1060-MDR', 74, 'LIBRE', 40.382720, -3.681780, 5);

INSERT INTO reservations (
    id,
    car_id,
    company_id,
    creator_user_id,
    hora_salida,
    origen_latitud,
    origen_longitud,
    office_id,
    estado,
    plazas_ocupadas,
    fecha_creacion
) VALUES
    (1, 4, 1, 1, TIMESTAMP '2026-05-26 08:15:00', 40.423900, -3.671940, 1, 'PENDIENTE', 1, CURRENT_TIMESTAMP),
    (2, 5, 1, 2, TIMESTAMP '2026-05-26 08:30:00', 40.437870, -3.676760, 1, 'CONFIRMADA', 2, CURRENT_TIMESTAMP),
    (3, 6, 2, 4, TIMESTAMP '2026-05-26 08:00:00', 40.392280, -3.697670, 3, 'COMPLETA', 5, CURRENT_TIMESTAMP);

INSERT INTO reservation_users (reservation_id, user_id) VALUES
    (1, 1),
    (2, 2),
    (2, 3),
    (3, 4),
    (3, 5),
    (3, 6),
    (3, 7),
    (3, 8);

ALTER TABLE companies ALTER COLUMN id RESTART WITH 5;
ALTER TABLE offices ALTER COLUMN id RESTART WITH 9;
ALTER TABLE app_users ALTER COLUMN id RESTART WITH 12;
ALTER TABLE cars ALTER COLUMN id RESTART WITH 61;
ALTER TABLE reservations ALTER COLUMN id RESTART WITH 4;
