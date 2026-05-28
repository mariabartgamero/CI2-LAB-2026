ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_estado_check;

ALTER TABLE reservations ADD CONSTRAINT reservations_estado_check
CHECK (estado IN ('ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'));
