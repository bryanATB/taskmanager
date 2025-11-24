package demo.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import demo.model.Proyecto;
import demo.model.Tarea;
import demo.model.Usuario;
import demo.repository.UsuarioRepository;
import demo.service.ProyectoService;

@Controller
public class ProyectoController {
    private static final Logger logger = LoggerFactory.getLogger(ProyectoController.class);
    
    @Autowired
    private ProyectoService proyectoService;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @GetMapping("/proyectos")
    public String proyectosPage(Model model, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        model.addAttribute("userName", usuario.getNombre());
        return "proyectos";
    }
    
    @GetMapping("/create-proyecto")
    public String createProyectoPage(Model model, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        model.addAttribute("userName", usuario.getNombre());
        return "create-proyecto";
    }
    
    @GetMapping("/view-proyecto/{id}")
    public String viewProyecto(@PathVariable Integer id, Model model, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        model.addAttribute("userName", usuario.getNombre());
        model.addAttribute("proyectoId", id);
        return "view-proyecto";
    }
    
    @GetMapping("/api/proyectos")
    @ResponseBody
    public List<Map<String, Object>> getAllProyectos(Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        Usuario managedUser = usuarioRepository.findById(usuario.getId()).orElse(usuario);
        List<Proyecto> proyectos = proyectoService.getProyectosByUsuario(managedUser);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Proyecto p : proyectos) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("nombre", p.getNombre());
            m.put("descripcion", p.getDescripcion());
            m.put("color", p.getColor());
            m.put("fechaInicio", p.getFechaInicio() != null ? p.getFechaInicio().toString() : null);
            m.put("fechaFin", p.getFechaFin() != null ? p.getFechaFin().toString() : null);
            m.put("estado", p.getEstado().toString());
            m.put("cantidadTareas", p.getTareas() != null ? p.getTareas().size() : 0);
            result.add(m);
        }
        
        return result;
    }
    
    @GetMapping("/api/proyectos/{id}")
    @ResponseBody
    public ResponseEntity<?> getProyecto(@PathVariable Integer id, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        Usuario managedUser = usuarioRepository.findById(usuario.getId()).orElse(usuario);
        
        Optional<Proyecto> proyectoOpt = proyectoService.getProyectoWithTareas(id, managedUser);
        
        if (proyectoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Proyecto no encontrado"));
        }
        
        Proyecto p = proyectoOpt.get();
        Map<String, Object> result = new HashMap<>();
        result.put("id", p.getId());
        result.put("nombre", p.getNombre());
        result.put("descripcion", p.getDescripcion());
        result.put("color", p.getColor());
        result.put("fechaInicio", p.getFechaInicio() != null ? p.getFechaInicio().toString() : null);
        result.put("fechaFin", p.getFechaFin() != null ? p.getFechaFin().toString() : null);
        result.put("estado", p.getEstado().toString());
        
        List<Map<String, Object>> tareas = new ArrayList<>();
        if (p.getTareas() != null) {
            for (Tarea t : p.getTareas()) {
                Map<String, Object> tareaMap = new HashMap<>();
                tareaMap.put("id", t.getId());
                tareaMap.put("titulo", t.getTitulo());
                tareaMap.put("estado", t.getEstado().toString());
                tareaMap.put("prioridad", t.getPrioridad().toString());
                tareas.add(tareaMap);
            }
        }
        result.put("tareas", tareas);
        
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/api/proyectos")
    @ResponseBody
    public ResponseEntity<?> createProyecto(@RequestBody Map<String, Object> payload, Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            Usuario managedUser = usuarioRepository.findById(usuario.getId()).orElse(usuario);
            
            Proyecto proyecto = new Proyecto();
            proyecto.setNombre((String) payload.get("nombre"));
            proyecto.setDescripcion((String) payload.get("descripcion"));
            proyecto.setColor((String) payload.get("color"));
            proyecto.setUsuario(managedUser);
            
            if (payload.get("fechaInicio") != null) {
                proyecto.setFechaInicio(java.time.LocalDate.parse((String) payload.get("fechaInicio")));
            }
            
            if (payload.get("fechaFin") != null) {
                proyecto.setFechaFin(java.time.LocalDate.parse((String) payload.get("fechaFin")));
            }
            
            Proyecto saved = proyectoService.saveProyecto(proyecto);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("nombre", saved.getNombre());
            response.put("mensaje", "Proyecto creado exitosamente");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error creando proyecto", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al crear el proyecto: " + e.getMessage()));
        }
    }
    
    @PutMapping("/api/proyectos/{id}")
    @ResponseBody
    public ResponseEntity<?> updateProyecto(@PathVariable Integer id, @RequestBody Map<String, Object> payload, Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            Usuario managedUser = usuarioRepository.findById(usuario.getId()).orElse(usuario);
            
            Optional<Proyecto> proyectoOpt = proyectoService.getProyectoById(id, managedUser);
            
            if (proyectoOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Proyecto no encontrado"));
            }
            
            Proyecto proyecto = proyectoOpt.get();
            proyecto.setNombre((String) payload.get("nombre"));
            proyecto.setDescripcion((String) payload.get("descripcion"));
            proyecto.setColor((String) payload.get("color"));
            
            if (payload.get("fechaInicio") != null) {
                proyecto.setFechaInicio(java.time.LocalDate.parse((String) payload.get("fechaInicio")));
            }
            
            if (payload.get("fechaFin") != null) {
                proyecto.setFechaFin(java.time.LocalDate.parse((String) payload.get("fechaFin")));
            }
            
            if (payload.get("estado") != null) {
                proyecto.setEstado(Proyecto.EstadoProyecto.valueOf((String) payload.get("estado")));
            }
            
            Proyecto saved = proyectoService.saveProyecto(proyecto);
            
            return ResponseEntity.ok(Map.of("success", true, "mensaje", "Proyecto actualizado"));
        } catch (Exception e) {
            logger.error("Error actualizando proyecto", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al actualizar el proyecto"));
        }
    }
    
    @DeleteMapping("/api/proyectos/{id}")
    @ResponseBody
    public ResponseEntity<?> deleteProyecto(@PathVariable Integer id, Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            Usuario managedUser = usuarioRepository.findById(usuario.getId()).orElse(usuario);
            
            Optional<Proyecto> proyectoOpt = proyectoService.getProyectoById(id, managedUser);
            
            if (proyectoOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Proyecto no encontrado"));
            }
            
            proyectoService.deleteProyecto(id);
            
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.error("Error eliminando proyecto", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al eliminar el proyecto"));
        }
    }
    
    @PostMapping("/api/proyectos/{proyectoId}/tareas/{tareaId}")
    @ResponseBody
    public ResponseEntity<?> agregarTarea(@PathVariable Integer proyectoId, @PathVariable Integer tareaId, Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            Usuario managedUser = usuarioRepository.findById(usuario.getId()).orElse(usuario);
            
            proyectoService.agregarTareaAProyecto(proyectoId, tareaId, managedUser);
            
            return ResponseEntity.ok(Map.of("success", true, "mensaje", "Tarea agregada al proyecto"));
        } catch (Exception e) {
            logger.error("Error agregando tarea", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al agregar la tarea"));
        }
    }
    
    @DeleteMapping("/api/proyectos/{proyectoId}/tareas/{tareaId}")
    @ResponseBody
    public ResponseEntity<?> removerTarea(@PathVariable Integer proyectoId, @PathVariable Integer tareaId, Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            Usuario managedUser = usuarioRepository.findById(usuario.getId()).orElse(usuario);
            
            proyectoService.removerTareaDeProyecto(proyectoId, tareaId, managedUser);
            
            return ResponseEntity.ok(Map.of("success", true, "mensaje", "Tarea removida del proyecto"));
        } catch (Exception e) {
            logger.error("Error removiendo tarea", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al remover la tarea"));
        }
    }
}