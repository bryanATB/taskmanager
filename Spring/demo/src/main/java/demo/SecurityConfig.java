package demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.ignoringRequestMatchers("/tasks/**", "/save-task"))
            .authorizeHttpRequests((requests) -> requests
                .requestMatchers("/css/**", "/js/**", "/register", "/process-registration").permitAll()
                .requestMatchers("/", "/login").permitAll()
                .requestMatchers("/tasks/**", "/save-task").authenticated()
                .requestMatchers(
                "/categories", 
                "/create-category", 
                "/history",
                "/api/categories/**",
                "/api/tasks/active",
                "/api/tasks/completed"
                ).authenticated()
                .anyRequest().authenticated()
                
            )
            .formLogin((form) -> form
                .loginPage("/")
                .loginProcessingUrl("/login")
                .usernameParameter("email")
                .passwordParameter("password")
                .defaultSuccessUrl("/dashboard", true)
                .failureUrl("/?error")
                .permitAll()
            )
            .logout((logout) -> logout
                .logoutSuccessUrl("/?logout")
                .permitAll()
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}