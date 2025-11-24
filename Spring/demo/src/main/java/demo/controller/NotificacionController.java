package demo.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import demo.model.Notificacion;
import demo.model.Usuario;
import demo.repository.UsuarioRepository;
import demo.service.NotificacionService;

@Controller
public class NotificacionController {
    private static final Logger logger = LoggerFactory.getLogger(NotificacionController.class);
    
    @Autowired
    private NotificacionService notificacionService;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @GetMapping("/notificaciones")
    public String notificacionesPage(Model model, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        model.addAttribute("userName", usuario.getNombre());
        return "notificaciones";
    }
    
    @GetMapping("/api/notificaciones")
    @ResponseBody
    public List<Map<String, Object>> getAllNotificaciones(Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        List<Notificacion> notificaciones = notificacionService.getNotificacionesByUsuario(usuario.getId());
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Notificacion n : notificaciones) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("tipo", n.getTipo());
            m.put("mensaje", n.getMensaje());
            m.put("leida", n.getLeida());
            m.put("fechaCreacion", n.getFechaCreacion().toString());
            m.put("tareaId", n.getTarea() != null ? n.getTarea().getId() : null);
            m.put("tareaTitulo", n.getTarea() != null ? n.getTarea().getTitulo() : null);
            result.add(m);
        }
        
        return result;
    }
    
    @GetMapping("/api/notificaciones/count")
    @ResponseBody
    public Map<String, Long> countNotificacionesNoLeidas(Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        long count = notificacionService.countNotificacionesNoLeidas(usuario.getId());
        return Map.of("count", count);
    }
    
    @PostMapping("/api/notificaciones/{id}/marcar-leida")
    @ResponseBody
    public ResponseEntity<?> marcarComoLeida(@PathVariable Integer id, Authentication auth) {
        try {
            notificacionService.marcarComoLeida(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.error("Error marcando notificación como leída", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al marcar la notificación"));
        }
    }
    
    @PostMapping("/api/notificaciones/marcar-todas-leidas")
    @ResponseBody
    public ResponseEntity<?> marcarTodasComoLeidas(Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            notificacionService.marcarTodasComoLeidas(usuario.getId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.error("Error marcando todas las notificaciones", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al marcar las notificaciones"));
        }
    }
    
    @DeleteMapping("/api/notificaciones/{id}")
    @ResponseBody
    public ResponseEntity<?> deleteNotificacion(@PathVariable Integer id, Authentication auth) {
        try {
            notificacionService.eliminarNotificacion(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.error("Error eliminando notificación", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al eliminar la notificación"));
        }
    }
    
    @DeleteMapping("/api/notificaciones/limpiar-leidas")
    @ResponseBody
    public ResponseEntity<?> limpiarLeidas(Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            notificacionService.eliminarLeidasDelUsuario(usuario.getId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.error("Error limpiando notificaciones leídas", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al limpiar las notificaciones"));
        }
    }
    
    @PostMapping("/api/notificaciones/generar")
    @ResponseBody
    public ResponseEntity<?> generarNotificaciones(Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            notificacionService.generarNotificacionesParaUsuario(usuario.getId());
            return ResponseEntity.ok(Map.of("success", true, "mensaje", "Notificaciones generadas"));
        } catch (Exception e) {
            logger.error("Error generando notificaciones", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al generar notificaciones"));
        }
    }
}