package demo.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import demo.model.Notificacion;
import demo.model.Tarea;
import demo.model.Usuario;
import demo.repository.NotificacionRepository;
import demo.repository.TareaRepository;
import demo.repository.UsuarioRepository;

@Service
public class NotificacionService {
    
    @Autowired
    private NotificacionRepository notificacionRepository;
    
    @Autowired
    private TareaRepository tareaRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    public List<Notificacion> getNotificacionesByUsuario(Integer usuarioId) {
        return notificacionRepository.findByUsuarioIdOrderByFechaCreacionDesc(usuarioId);
    }
    
    public List<Notificacion> getNotificacionesNoLeidas(Integer usuarioId) {
        return notificacionRepository.findByUsuarioIdAndLeidaOrderByFechaCreacionDesc(usuarioId, false);
    }
    
    public long countNotificacionesNoLeidas(Integer usuarioId) {
        return notificacionRepository.countNoLeidasByUsuarioId(usuarioId);
    }
    
    public Notificacion crearNotificacion(Usuario usuario, String tipo, String mensaje) {
        Notificacion notificacion = new Notificacion(usuario, tipo, mensaje);
        return notificacionRepository.save(notificacion);
    }
    
    public Notificacion crearNotificacionTarea(Usuario usuario, Tarea tarea, String tipo, String mensaje) {
        Notificacion notificacion = new Notificacion(usuario, tarea, tipo, mensaje);
        return notificacionRepository.save(notificacion);
    }
    
    @Transactional
    public void marcarComoLeida(Integer notificacionId) {
        notificacionRepository.findById(notificacionId).ifPresent(n -> {
            n.setLeida(true);
            notificacionRepository.save(n);
        });
    }
    
    @Transactional
    public void marcarTodasComoLeidas(Integer usuarioId) {
        notificacionRepository.marcarTodasComoLeidas(usuarioId);
    }
    
    @Transactional
    public void eliminarNotificacion(Integer notificacionId) {
        notificacionRepository.deleteById(notificacionId);
    }
    
    @Transactional
    public void eliminarLeidasDelUsuario(Integer usuarioId) {
        notificacionRepository.deleteByUsuarioIdAndLeida(usuarioId, true);
    }
    
    // Método programado para generar notificaciones automáticas
    // Se ejecuta todos los días a las 8:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void generarNotificacionesAutomaticas() {
        LocalDate hoy = LocalDate.now();
        LocalDate tresDiasDespues = hoy.plusDays(3);
        
        // Obtener todos los usuarios
        List<Usuario> usuarios = usuarioRepository.findAll();
        
        for (Usuario usuario : usuarios) {
            // Buscar tareas próximas a vencer (3 días o menos)
            List<Tarea> tareasProximas = tareaRepository.findProximasAVencer(
                usuario.getId(), 
                hoy, 
                tresDiasDespues
            );
            
            if (!tareasProximas.isEmpty()) {
                String mensaje = String.format(
                    "Tienes %d tarea(s) que vencen en los próximos 3 días", 
                    tareasProximas.size()
                );
                crearNotificacion(usuario, "TAREA_PROXIMA", mensaje);
            }
            
            // Buscar tareas vencidas
            List<Tarea> tareasVencidas = tareaRepository.findVencidas(usuario.getId(), hoy);
            
            if (!tareasVencidas.isEmpty()) {
                String mensaje = String.format(
                    "Tienes %d tarea(s) vencida(s)", 
                    tareasVencidas.size()
                );
                crearNotificacion(usuario, "TAREA_VENCIDA", mensaje);
            }
        }
    }
    
    // Método para generar notificación manualmente
    @Transactional
    public void generarNotificacionesParaUsuario(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) return;
        
        LocalDate hoy = LocalDate.now();
        LocalDate tresDiasDespues = hoy.plusDays(3);
        
        List<Tarea> tareasProximas = tareaRepository.findProximasAVencer(
            usuarioId, 
            hoy, 
            tresDiasDespues
        );
        
        for (Tarea tarea : tareasProximas) {
            String mensaje = String.format(
                "La tarea '%s' vence el %s", 
                tarea.getTitulo(),
                tarea.getFechaLimite()
            );
            crearNotificacionTarea(usuario, tarea, "TAREA_PROXIMA", mensaje);
        }
        
        List<Tarea> tareasVencidas = tareaRepository.findVencidas(usuarioId, hoy);
        
        for (Tarea tarea : tareasVencidas) {
            String mensaje = String.format(
                "La tarea '%s' está vencida desde el %s", 
                tarea.getTitulo(),
                tarea.getFechaLimite()
            );
            crearNotificacionTarea(usuario, tarea, "TAREA_VENCIDA", mensaje);
        }
    }
}