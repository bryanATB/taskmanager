package demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class DemoApplication {

    @PostConstruct
    public void init() {
        // Establecer zona horaria por defecto
        TimeZone.setDefault(TimeZone.getTimeZone("America/Bogota")); // O tu zona horaria
    }

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}