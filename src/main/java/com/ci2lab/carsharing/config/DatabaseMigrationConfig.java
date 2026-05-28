package com.ci2lab.carsharing.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseMigrationConfig {

    @Bean
    CommandLineRunner applyDatabaseMigrations(JdbcTemplate jdbcTemplate) {
        return args -> {
            jdbcTemplate.execute("""
                ALTER TABLE IF EXISTS reservations
                ALTER COLUMN office_id DROP NOT NULL
                """);
            jdbcTemplate.execute("""
                ALTER TABLE IF EXISTS reservations
                DROP CONSTRAINT IF EXISTS reservations_estado_check
                """);
            jdbcTemplate.execute("""
                ALTER TABLE IF EXISTS reservations
                ADD CONSTRAINT reservations_estado_check
                CHECK (estado IN ('ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'))
                """);
        };
    }
}
