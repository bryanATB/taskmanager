package demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import demo.model.Historial;

@Repository
public interface HistorialRepository extends JpaRepository<Historial, Integer> {
    // Buscar historial por tarea
    List<Historial> findByTareaId(Integer tareaId);
    
    // Buscar historial por usuario
    List<Historial> findByUsuarioId(Integer usuarioId);
    
    // Buscar historial por tarea ordenado por fecha
    List<Historial> findByTareaIdOrderByFechaDesc(Integer tareaId);
    
    // Buscar solo tareas completadas por usuario (las completadas tienen `titulo` no nulo)
    List<Historial> findByUsuarioIdAndTituloIsNotNullOrderByFechaDesc(Integer usuarioId);

    // Buscar historiales de completadas para una tarea
    List<Historial> findByTareaIdAndTituloIsNotNull(Integer tareaId);
}