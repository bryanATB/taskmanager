package demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import demo.model.Categoria;
import demo.model.Usuario;
import demo.repository.CategoriaRepository;
import demo.repository.UsuarioRepository;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner init(UsuarioRepository usuarioRepository, 
                          CategoriaRepository categoriaRepository,
                          PasswordEncoder passwordEncoder) {
        return args -> {
            // Crear usuario por defecto
            if (!usuarioRepository.findByCorreo("admin@local").isPresent()) {
                Usuario usuario = new Usuario();
                usuario.setNombre("Admin");
                usuario.setCorreo("admin@local");
                usuario.setContraseña(passwordEncoder.encode("admin"));
                usuario.setRole("USER");
                usuarioRepository.save(usuario);
                System.out.println("✅ Usuario creado: admin@local / admin");
            }
            
            // Crear categorías por defecto
            if (categoriaRepository.count() == 0) {
                categoriaRepository.save(new Categoria("Trabajo"));
                categoriaRepository.save(new Categoria("Personal"));
                categoriaRepository.save(new Categoria("Estudios"));
                categoriaRepository.save(new Categoria("Hogar"));
                System.out.println("✅ Categorías creadas");
            }
        };
    }
}