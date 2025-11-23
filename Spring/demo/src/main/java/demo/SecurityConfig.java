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
            .csrf(csrf -> csrf.ignoringRequestMatchers("/tasks/**", "/save-task", "/api/**"))
            .authorizeHttpRequests((requests) -> requests
                // CRÍTICO: Los recursos estáticos deben ser lo primero y más permisivos
                .requestMatchers("/css/**", "/js/**", "/images/**", "/fonts/**", "/favicon.ico").permitAll()
                // Páginas públicas
                .requestMatchers("/", "/login", "/register", "/process-registration").permitAll()
                // Rutas autenticadas
                .requestMatchers("/tasks/**", "/save-task").authenticated()
                .requestMatchers(
                    "/dashboard",
                    "/create-task",
                    "/edit-task/**",
                    "/view-task/**",
                    "/categories", 
                    "/create-category", 
                    "/history",
                    "/proyectos",
                    "/create-proyecto",
                    "/view-proyecto/**",
                    "/notificaciones"
                ).authenticated()
                // APIs autenticadas
                .requestMatchers(
                    "/api/categories/**",
                    "/api/tasks/**",
                    "/api/proyectos/**",
                    "/api/notificaciones/**"
                ).authenticated()
                // Todo lo demás requiere autenticación
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