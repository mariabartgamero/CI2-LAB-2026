package com.ci2lab.carsharing.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseMigrationConfig {

    @Bean
    CommandLineRunner allowReturnReservationsWithoutOffice(JdbcTemplate jdbcTemplate) {
        return args -> jdbcTemplate.execute("""
                ALTER TABLE IF EXISTS reservations
                ALTER COLUMN office_id DROP NOT NULL
                """);
    }
}
