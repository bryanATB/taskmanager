package demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import demo.model.User;
import demo.repository.UserRepository;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner init(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByEmail("admin@local") == null) {
                User u = new User();
                u.setName("Admin");
                u.setEmail("admin@local");
                u.setPassword(passwordEncoder.encode("admin"));
                u.setRole("USER");
                userRepository.save(u);
                System.out.println("Created default user: admin@local / admin");
            }
        };
    }
}
