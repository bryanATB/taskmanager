package demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import demo.model.Subtarea;

@Repository
public interface SubtareaRepository extends JpaRepository<Subtarea, Integer> {
    // Buscar subtareas por tarea
    List<Subtarea> findByTareaId(Integer tareaId);
    
    // Buscar subtareas completadas/no completadas
    List<Subtarea> findByTareaIdAndCompletada(Integer tareaId, Boolean completada);
}
