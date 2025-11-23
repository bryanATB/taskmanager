package demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import demo.model.Proyecto;
import demo.model.Proyecto.EstadoProyecto;
import demo.model.Usuario;

@Repository
public interface ProyectoRepository extends JpaRepository<Proyecto, Integer> {
    
    List<Proyecto> findByUsuario(Usuario usuario);
    
    List<Proyecto> findByUsuarioAndEstado(Usuario usuario, EstadoProyecto estado);
    
    Optional<Proyecto> findByIdAndUsuario(Integer id, Usuario usuario);
    
    @Query("SELECT p FROM Proyecto p WHERE p.usuario.id = :usuarioId AND p.estado = :estado ORDER BY p.fechaCreacion DESC")
    List<Proyecto> findByUsuarioIdAndEstado(@Param("usuarioId") Integer usuarioId, @Param("estado") EstadoProyecto estado);
    
    @Query("SELECT COUNT(p) FROM Proyecto p WHERE p.usuario.id = :usuarioId AND p.estado = 'ACTIVO'")
    long countActivosByUsuarioId(@Param("usuarioId") Integer usuarioId);
    
    @Query("SELECT p FROM Proyecto p LEFT JOIN FETCH p.tareas WHERE p.id = :proyectoId AND p.usuario = :usuario")
    Optional<Proyecto> findByIdAndUsuarioWithTareas(@Param("proyectoId") Integer proyectoId, @Param("usuario") Usuario usuario);
}