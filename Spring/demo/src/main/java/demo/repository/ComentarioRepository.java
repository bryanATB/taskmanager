package demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import demo.model.Comentario;

@Repository
public interface ComentarioRepository extends JpaRepository<Comentario, Integer> {
    // Buscar comentarios por tarea
    List<Comentario> findByTareaId(Integer tareaId);
    
    // Buscar comentarios por usuario
    List<Comentario> findByUsuarioId(Integer usuarioId);
    
    // Buscar comentarios por tarea ordenados por fecha
    List<Comentario> findByTareaIdOrderByFechaDesc(Integer tareaId);
}
