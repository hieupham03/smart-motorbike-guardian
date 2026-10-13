package com.guardian;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import static org.assertj.core.api.Assertions.*;

class MigrationTest {
    @Test void existingSchemaIsBaselinedAndLegacySeedCannotBecomeHardwareMeasurements() {
        var db = new DriverManagerDataSource("jdbc:h2:mem:migration_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1", "sa", "");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V1__initial_schema.sql")).execute(db);
        var sql = new JdbcTemplate(db);
        sql.update("insert into devices(device_id,device_uuid,name,lifecycle_state) values ('old','old-uuid','Old seed','ACTIVE')");
        sql.update("insert into telemetry_readings(reading_id,device_id,ts) values ('old-reading','old',123)");
        var flyway = Flyway.configure().dataSource(db).baselineOnMigrate(true).baselineVersion("1").load();
        assertThat(flyway.migrate().migrationsExecuted).isEqualTo(1);
        assertThat(sql.queryForObject("select data_source from telemetry_readings where reading_id='old-reading'",String.class)).isEqualTo("LEGACY");
        assertThat(sql.queryForObject("select last_latitude from devices where device_id='old'",Double.class)).isNull();
        assertThat(sql.queryForObject("select last_battery_v from devices where device_id='old'",Double.class)).isNull();
        assertThat(sql.queryForObject("select lifecycle_state from devices where device_id='old'",String.class)).isEqualTo("OFFLINE");
        assertThat(flyway.migrate().migrationsExecuted).isZero();
    }
}
