package demo.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import demo.model.Tarea;
import demo.model.Tarea.Estado;

@Repository
public interface TareaRepository extends JpaRepository<Tarea, Integer> {
    // Métodos existentes
    List<Tarea> findByUsuarioId(Integer usuarioId);
    List<Tarea> findByEstado(Tarea.Estado estado);
    List<Tarea> findByUsuarioIdAndEstadoNot(Integer usuarioId, Estado estado);
    List<Tarea> findByUsuarioIdAndEstado(Integer usuarioId, Estado estado);
    List<Tarea> findByCategoriaId(Integer categoriaId);
    List<Tarea> findByPrioridad(Tarea.Prioridad prioridad);
    List<Tarea> findByUsuarioIdAndPrioridad(Integer usuarioId, Tarea.Prioridad prioridad);
    
    // NUEVOS MÉTODOS PARA ESTADÍSTICAS
    
    // Contar tareas activas (no completadas)
    @Query("SELECT COUNT(t) FROM Tarea t WHERE t.usuario.id = :usuarioId AND t.estado != 'Completada' AND t.estado != 'Incompleta'")
    long countActivasByUsuarioId(@Param("usuarioId") Integer usuarioId);
    
    // Contar tareas que vencen hoy
    @Query("SELECT COUNT(t) FROM Tarea t WHERE t.usuario.id = :usuarioId AND t.fechaLimite = :fecha AND t.estado != 'Completada'")
    long countVencenHoyByUsuarioId(@Param("usuarioId") Integer usuarioId, @Param("fecha") LocalDate fecha);
    
    // Contar tareas con prioridad alta
    @Query("SELECT COUNT(t) FROM Tarea t WHERE t.usuario.id = :usuarioId AND t.prioridad = 'Alta' AND t.estado != 'Completada'")
    long countPrioridadAltaByUsuarioId(@Param("usuarioId") Integer usuarioId);
    
    // Contar tareas completadas en una fecha específica
    @Query("SELECT COUNT(h) FROM Historial h WHERE h.usuario.id = :usuarioId AND h.titulo IS NOT NULL AND DATE(h.fecha) = :fecha")
    long countCompletadasEnFecha(@Param("usuarioId") Integer usuarioId, @Param("fecha") LocalDate fecha);
    
    // Buscar tareas próximas a vencer (solo activas)
    @Query("SELECT t FROM Tarea t WHERE t.usuario.id = :usuarioId AND t.estado != 'Completada' AND t.estado != 'Incompleta' AND t.fechaLimite BETWEEN :desde AND :hasta ORDER BY t.fechaLimite ASC")
    List<Tarea> findProximasAVencer(
        @Param("usuarioId") Integer usuarioId, 
        @Param("desde") LocalDate desde, 
        @Param("hasta") LocalDate hasta
    );

    // Buscar tareas incompletas
    @Query("SELECT t FROM Tarea t WHERE t.usuario.id = :usuarioId AND t.estado = 'Incompleta' ORDER BY t.fechaLimite ASC")
    List<Tarea> findVencidas(@Param("usuarioId") Integer usuarioId, @Param("fecha") LocalDate fecha);
}