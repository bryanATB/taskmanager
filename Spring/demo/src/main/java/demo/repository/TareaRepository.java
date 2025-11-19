package demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import demo.model.Tarea;
import demo.model.Tarea.Estado;

@Repository
public interface TareaRepository extends JpaRepository<Tarea, Integer> {
    // Buscar tareas por usuario
    List<Tarea> findByUsuarioId(Integer usuarioId);
    
    // Buscar tareas por estado
    List<Tarea> findByEstado(Tarea.Estado estado);
    
    // Buscar tareas por usuario y estado

    List<Tarea> findByUsuarioIdAndEstadoNot(Integer usuarioId, Estado estado);
    List<Tarea> findByUsuarioIdAndEstado(Integer usuarioId, Estado estado);
    
    // Buscar tareas por categoría
    List<Tarea> findByCategoriaId(Integer categoriaId);
    
    // Buscar tareas por prioridad
    List<Tarea> findByPrioridad(Tarea.Prioridad prioridad);
    
    // Buscar tareas por usuario y prioridad
    List<Tarea> findByUsuarioIdAndPrioridad(Integer usuarioId, Tarea.Prioridad prioridad);

}