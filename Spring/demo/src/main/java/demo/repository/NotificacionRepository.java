package demo.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import demo.model.Notificacion;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Integer> {
    
    List<Notificacion> findByUsuarioIdOrderByFechaCreacionDesc(Integer usuarioId);
    
    List<Notificacion> findByUsuarioIdAndLeidaOrderByFechaCreacionDesc(Integer usuarioId, Boolean leida);
    
    @Query("SELECT COUNT(n) FROM Notificacion n WHERE n.usuario.id = :usuarioId AND n.leida = false")
    long countNoLeidasByUsuarioId(@Param("usuarioId") Integer usuarioId);
    
    @Modifying
    @Query("UPDATE Notificacion n SET n.leida = true WHERE n.usuario.id = :usuarioId AND n.leida = false")
    void marcarTodasComoLeidas(@Param("usuarioId") Integer usuarioId);
    
    @Query("SELECT n FROM Notificacion n WHERE n.usuario.id = :usuarioId AND n.fechaCreacion >= :fecha ORDER BY n.fechaCreacion DESC")
    List<Notificacion> findRecentesByUsuarioId(@Param("usuarioId") Integer usuarioId, @Param("fecha") LocalDateTime fecha);
    
    void deleteByUsuarioIdAndLeida(Integer usuarioId, Boolean leida);
}