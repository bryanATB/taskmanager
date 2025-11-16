package demo.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import demo.model.Tarea;
import demo.model.Usuario;
import demo.repository.TareaRepository;
import demo.repository.UsuarioRepository;

@Controller
public class TaskController {
    private static final Logger logger = LoggerFactory.getLogger(TaskController.class);
    
    @Autowired
    private TareaRepository tareaRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/create-task")
    public String showCreateTaskForm(Model model) {
        model.addAttribute("task", new Tarea());
        return "create-task";
    }

    @PostMapping("/save-task")
    @ResponseBody
    public ResponseEntity<?> saveTask(@RequestBody Map<String, Object> payload, Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            Usuario managedUser = usuarioRepository.findById(usuario.getId()).orElse(null);
            
            if (managedUser == null) {
                managedUser = usuarioRepository.findByCorreo(usuario.getCorreo()).orElse(null);
            }
            if (managedUser == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Usuario no encontrado en la base de datos"));
            }

            Tarea tarea = new Tarea();
            tarea.setTitulo((String) payload.get("title"));
            tarea.setDescripcion((String) payload.get("description"));
            
            // Convertir fechaLimite
            String dueDateStr = (String) payload.get("dueDate");
            if (dueDateStr != null && !dueDateStr.isEmpty()) {
                try {
                    LocalDate fechaLimite = LocalDate.parse(dueDateStr.substring(0, 10));
                    tarea.setFechaLimite(fechaLimite);
                } catch (Exception e) {
                    logger.warn("Error parseando fecha: " + dueDateStr, e);
                }
            }
            
            // Convertir prioridad
            String prioridadStr = (String) payload.get("priority");
            if (prioridadStr != null) {
                try {
                    Tarea.Prioridad prioridad = Tarea.Prioridad.valueOf(
                        prioridadStr.substring(0, 1).toUpperCase() + 
                        prioridadStr.substring(1).toLowerCase()
                    );
                    tarea.setPrioridad(prioridad);
                } catch (Exception e) {
                    tarea.setPrioridad(Tarea.Prioridad.Media);
                }
            }
            
            // Convertir estado
            String estadoStr = (String) payload.get("status");
            if (estadoStr != null) {
                try {
                    Tarea.Estado estado = Tarea.Estado.valueOf(estadoStr.replace(" ", "_"));
                    tarea.setEstado(estado);
                } catch (Exception e) {
                    tarea.setEstado(Tarea.Estado.Pendiente);
                }
            }
            
            tarea.setUsuario(managedUser);
            Tarea saved = tareaRepository.save(tarea);
            
            // Convertir a formato compatible con el frontend
            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("title", saved.getTitulo());
            response.put("description", saved.getDescripcion() != null ? saved.getDescripcion() : "");
            response.put("dueDate", saved.getFechaLimite() != null ? saved.getFechaLimite().toString() : "");
            response.put("priority", saved.getPrioridad().toString().toUpperCase());
            response.put("status", saved.getEstado().toString().replace("_", " ").toUpperCase());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error guardando tarea", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al guardar la tarea: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/save-task", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public String saveTaskForm(@RequestParam Map<String, String> params, Authentication auth, RedirectAttributes redirectAttributes) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            Usuario managedUser = usuarioRepository.findById(usuario.getId()).orElse(null);
            
            if (managedUser == null) {
                managedUser = usuarioRepository.findByCorreo(usuario.getCorreo()).orElse(null);
            }
            if (managedUser == null) {
                throw new IllegalStateException("Usuario no encontrado en la base de datos");
            }

            Tarea tarea = new Tarea();
            tarea.setTitulo(params.get("title"));
            tarea.setDescripcion(params.get("description"));
            
            String dueDateStr = params.get("dueDate");
            if (dueDateStr != null && !dueDateStr.isEmpty()) {
                try {
                    LocalDate fechaLimite = LocalDate.parse(dueDateStr.substring(0, 10));
                    tarea.setFechaLimite(fechaLimite);
                } catch (Exception e) {
                    logger.warn("Error parseando fecha: " + dueDateStr);
                }
            }
            
            String prioridadStr = params.get("priority");
            if (prioridadStr != null) {
                try {
                    Tarea.Prioridad prioridad = Tarea.Prioridad.valueOf(
                        prioridadStr.substring(0, 1).toUpperCase() + 
                        prioridadStr.substring(1).toLowerCase()
                    );
                    tarea.setPrioridad(prioridad);
                } catch (Exception e) {
                    tarea.setPrioridad(Tarea.Prioridad.Media);
                }
            }
            
            String estadoStr = params.get("status");
            if (estadoStr != null) {
                try {
                    Tarea.Estado estado = Tarea.Estado.valueOf(estadoStr.replace(" ", "_"));
                    tarea.setEstado(estado);
                } catch (Exception e) {
                    tarea.setEstado(Tarea.Estado.Pendiente);
                }
            }
            
            tarea.setUsuario(managedUser);
            tareaRepository.save(tarea);
            redirectAttributes.addFlashAttribute("success", "Tarea guardada correctamente");
            return "redirect:/dashboard";
        } catch (Exception e) {
            logger.error("Error guardando tarea", e);
            redirectAttributes.addFlashAttribute("error", "Error guardando la tarea: " + e.getMessage());
            return "redirect:/create-task";
        }
    }

    @GetMapping("/tasks")
    @ResponseBody
    public List<Map<String, Object>> getTasks(Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        List<Tarea> tareas = tareaRepository.findByUsuarioId(usuario.getId());
        
        return tareas.stream().map(tarea -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", tarea.getId());
            map.put("title", tarea.getTitulo());
            map.put("description", tarea.getDescripcion() != null ? tarea.getDescripcion() : "");
            map.put("dueDate", tarea.getFechaLimite() != null ? tarea.getFechaLimite().toString() : "");
            map.put("priority", tarea.getPrioridad().toString().toUpperCase());
            map.put("status", tarea.getEstado().toString().replace("_", " ").toUpperCase());
            return map;
        }).collect(Collectors.toList());
    }

    @GetMapping("/edit-task/{id}")
    public String showEditTaskForm(@PathVariable Integer id, Model model, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        Optional<Tarea> tarea = tareaRepository.findById(id);
        
        if (tarea.isPresent() && tarea.get().getUsuario().getId().equals(usuario.getId())) {
            model.addAttribute("task", tarea.get());
            return "edit-task";
        }
        return "redirect:/dashboard";
    }

    @GetMapping("/view-task/{id}")
    public String viewTask(@PathVariable Integer id, Model model, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        Optional<Tarea> tarea = tareaRepository.findById(id);
        
        if (tarea.isPresent() && tarea.get().getUsuario().getId().equals(usuario.getId())) {
            model.addAttribute("task", tarea.get());
            return "view-task";
        }
        return "redirect:/dashboard";
    }

    @DeleteMapping("/tasks/{id}")
    @ResponseBody
    public Map<String, Boolean> deleteTask(@PathVariable Integer id, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        Optional<Tarea> tarea = tareaRepository.findById(id);
        
        if (tarea.isPresent() && tarea.get().getUsuario().getId().equals(usuario.getId())) {
            tareaRepository.deleteById(id);
            return Map.of("success", true);
        }
        return Map.of("success", false);
    }

    @PutMapping("/tasks/{id}")
    @ResponseBody
    public ResponseEntity<?> updateTask(@PathVariable Integer id, @RequestBody Map<String, Object> payload, Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            Optional<Tarea> existingTarea = tareaRepository.findById(id);
            
            if (existingTarea.isEmpty() || !existingTarea.get().getUsuario().getId().equals(usuario.getId())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Tarea no encontrada o no autorizada"));
            }
            
            Tarea tarea = existingTarea.get();
            tarea.setTitulo((String) payload.get("title"));
            tarea.setDescripcion((String) payload.get("description"));
            
            String dueDateStr = (String) payload.get("dueDate");
            if (dueDateStr != null && !dueDateStr.isEmpty()) {
                try {
                    LocalDate fechaLimite = LocalDate.parse(dueDateStr.substring(0, 10));
                    tarea.setFechaLimite(fechaLimite);
                } catch (Exception e) {
                    logger.warn("Error parseando fecha: " + dueDateStr);
                }
            }
            
            String prioridadStr = (String) payload.get("priority");
            if (prioridadStr != null) {
                try {
                    Tarea.Prioridad prioridad = Tarea.Prioridad.valueOf(
                        prioridadStr.substring(0, 1).toUpperCase() + 
                        prioridadStr.substring(1).toLowerCase()
                    );
                    tarea.setPrioridad(prioridad);
                } catch (Exception e) {
                    // mantener prioridad existente
                }
            }
            
            String estadoStr = (String) payload.get("status");
            if (estadoStr != null) {
                try {
                    Tarea.Estado estado = Tarea.Estado.valueOf(estadoStr.replace(" ", "_"));
                    tarea.setEstado(estado);
                } catch (Exception e) {
                    // mantener estado existente
                }
            }
            
            Tarea saved = tareaRepository.save(tarea);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("title", saved.getTitulo());
            response.put("description", saved.getDescripcion() != null ? saved.getDescripcion() : "");
            response.put("dueDate", saved.getFechaLimite() != null ? saved.getFechaLimite().toString() : "");
            response.put("priority", saved.getPrioridad().toString().toUpperCase());
            response.put("status", saved.getEstado().toString().replace("_", " ").toUpperCase());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error actualizando tarea", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al actualizar la tarea: " + e.getMessage()));
        }
    }
}