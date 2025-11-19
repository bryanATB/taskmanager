
package demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import demo.model.Categoria;
import demo.model.Usuario;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
    Optional<Categoria> findByNombre(String nombre);
    
    // NUEVOS MÉTODOS AGREGADOS
    List<Categoria> findByUsuario(Usuario usuario);
    
    Optional<Categoria> findByIdAndUsuario(Integer id, Usuario usuario);
    
    boolean existsByNombreAndUsuario(String nombre, Usuario usuario);
}
