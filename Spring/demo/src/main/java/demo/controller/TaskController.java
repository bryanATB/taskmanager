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

import demo.model.Historial;
import demo.model.Tarea;
import demo.model.Usuario;
import demo.repository.HistorialRepository;
import demo.repository.TareaRepository;
import demo.repository.UsuarioRepository;
import demo.service.CategoriaService;

@Controller
public class TaskController {
    private static final Logger logger = LoggerFactory.getLogger(TaskController.class);
    
    @Autowired
    private CategoriaService categoriaService;

    @Autowired
    private HistorialRepository historialRepository;

    @Autowired
    private TareaRepository tareaRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;

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
                    Tarea.Prioridad prioridad = parsePrioridad(prioridadStr);
                    tarea.setPrioridad(prioridad != null ? prioridad : Tarea.Prioridad.Media);
                } catch (Exception e) {
                    tarea.setPrioridad(Tarea.Prioridad.Media);
                }
            }

            // Convertir estado
            String estadoStr = (String) payload.get("status");
            if (estadoStr != null) {
                try {
                    Tarea.Estado estado = parseEstado(estadoStr);
                    tarea.setEstado(estado != null ? estado : Tarea.Estado.Pendiente);
                } catch (Exception e) {
                    tarea.setEstado(Tarea.Estado.Pendiente);
                }
            }
            
            // Asignar categoría
            Object categoriaIdObj = payload.get("categoryId");
            if (categoriaIdObj != null && !categoriaIdObj.toString().isEmpty()) {
                try {
                    Integer categoriaId = Integer.parseInt(categoriaIdObj.toString());
                    categoriaService.getCategoriaById(categoriaId, managedUser)
                        .ifPresent(tarea::setCategoria);
                } catch (Exception e) {
                    logger.warn("Error asignando categoría", e);
                }
            }
            
            tarea.setUsuario(managedUser);
            Tarea saved = tareaRepository.save(tarea);
            
            // Crear registro en historial
            historialRepository.save(new Historial(saved, managedUser, "Tarea creada"));
            
            return ResponseEntity.ok(convertTareaToMap(saved));
        } catch (Exception e) {
            logger.error("Error guardando tarea", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al guardar la tarea: " + e.getMessage()));
        }
    }

    // Método para convertir String a Prioridad
    private Tarea.Prioridad parsePrioridad(String prioridadStr) {
        if (prioridadStr == null) return null;
        try {
            return Tarea.Prioridad.valueOf(prioridadStr.trim().substring(0, 1).toUpperCase() + prioridadStr.trim().substring(1).toLowerCase());
        } catch (Exception e) {
            // Si falla, intenta comparar manualmente
            for (Tarea.Prioridad p : Tarea.Prioridad.values()) {
                if (p.name().equalsIgnoreCase(prioridadStr)) {
                    return p;
                }
            }
        }
        return null;
    }

    // Método para convertir String a Estado
    private Tarea.Estado parseEstado(String estadoStr) {
        if (estadoStr == null) return null;
        String s = estadoStr.trim();
        // Intentar coincidencia directa con el nombre del enum
        try {
            return Tarea.Estado.valueOf(s);
        } catch (Exception ignored) {}

        // Reemplazar espacios por guiones bajos y volver a intentar
        try {
            return Tarea.Estado.valueOf(s.replace(" ", "_"));
        } catch (Exception ignored) {}

        // Igualar de forma insensible a mayúsculas/minúsculas y con/sin guion bajo
        for (Tarea.Estado eVal : Tarea.Estado.values()) {
            String name = eVal.name();
            if (name.equalsIgnoreCase(s) || name.replace("_", " ").equalsIgnoreCase(s) || name.replace("_", " ").equalsIgnoreCase(s.replace("_", " "))) {
                return eVal;
            }
        }

        return null;
    }

    // Método para convertir Tarea a Map<String, Object> - CORREGIDO
    private Map<String, Object> convertTareaToMap(Tarea tarea) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", tarea.getId());
        map.put("title", tarea.getTitulo());
        map.put("description", tarea.getDescripcion() != null ? tarea.getDescripcion() : "");
        map.put("dueDate", tarea.getFechaLimite() != null ? tarea.getFechaLimite().toString() : "");
        map.put("priority", tarea.getPrioridad() != null ? tarea.getPrioridad().toString().toUpperCase() : "MEDIA");
        // Enviamos el estado en mayúsculas con guiones bajos para que el cliente
        // (JS) lo maneje fácilmente: PENDIENTE, EN_PROGRESO, COMPLETADA
        map.put("status", tarea.getEstado() != null ? tarea.getEstado().toString().toUpperCase() : "PENDIENTE");
        
        // Devolver objeto completo de categoría con todos sus datos
        if (tarea.getCategoria() != null) {
            Map<String, Object> categoryMap = new HashMap<>();
            categoryMap.put("id", tarea.getCategoria().getId());
            categoryMap.put("nombre", tarea.getCategoria().getNombre());
            categoryMap.put("color", tarea.getCategoria().getColor());
            map.put("category", categoryMap);
        } else {
            map.put("category", null);
        }
        
        return map;
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
                Tarea.Prioridad prioridad = parsePrioridad(prioridadStr);
                tarea.setPrioridad(prioridad != null ? prioridad : Tarea.Prioridad.Media);
            } else {
                tarea.setPrioridad(Tarea.Prioridad.Media);
            }

            String estadoStr = params.get("status");
            if (estadoStr != null) {
                Tarea.Estado estado = parseEstado(estadoStr);
                tarea.setEstado(estado != null ? estado : Tarea.Estado.Pendiente);
            } else {
                tarea.setEstado(Tarea.Estado.Pendiente);
            }

            // Manejar categoría desde el formulario
            String categoriaIdStr = params.get("categoryId");
            if (categoriaIdStr != null && !categoriaIdStr.isEmpty()) {
                try {
                    Integer categoriaId = Integer.parseInt(categoriaIdStr);
                    categoriaService.getCategoriaById(categoriaId, managedUser).ifPresent(tarea::setCategoria);
                } catch (Exception e) {
                    logger.warn("Error parseando categoryId desde formulario: " + categoriaIdStr, e);
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
        
        return tareas.stream().map(this::convertTareaToMap).collect(Collectors.toList());
    }

    @GetMapping("/edit-task/{id}")
    public String showEditTaskForm(@PathVariable Integer id, Model model, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        model.addAttribute("userName", usuario.getNombre());
        
        Optional<Tarea> tarea = tareaRepository.findById(id);
        
        if (tarea.isPresent() && tarea.get().getUsuario().getId().equals(usuario.getId())) {
            // Asegurar valores por defecto para evitar NPE en la plantilla
            Tarea t = tarea.get();
            if (t.getPrioridad() == null) t.setPrioridad(Tarea.Prioridad.Media);
            if (t.getEstado() == null) t.setEstado(Tarea.Estado.Pendiente);
            model.addAttribute("task", t);
            model.addAttribute("categoryId", t.getCategoria() != null ? t.getCategoria().getId() : null);
            return "edit-task";
        }
        return "redirect:/dashboard";
    }

    @GetMapping("/view-task/{id}")
    public String viewTask(@PathVariable Integer id, Model model, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        model.addAttribute("userName", usuario.getNombre());
        
        Optional<Tarea> tarea = tareaRepository.findById(id);
        
        if (tarea.isPresent() && tarea.get().getUsuario().getId().equals(usuario.getId())) {
            Tarea t = tarea.get();
            if (t.getPrioridad() == null) t.setPrioridad(Tarea.Prioridad.Media);
            if (t.getEstado() == null) t.setEstado(Tarea.Estado.Pendiente);

            // Construir un Map uniforme para la vista, igual que la vista desde historial
            Map<String, Object> taskData = new HashMap<>();
            taskData.put("id", t.getId());
            taskData.put("titulo", t.getTitulo());
            taskData.put("descripcion", t.getDescripcion());
            taskData.put("fechaLimite", t.getFechaLimite());
            taskData.put("prioridad", t.getPrioridad());
            taskData.put("estado", t.getEstado());

            if (t.getCategoria() != null) {
                Map<String, Object> categoriaMap = new HashMap<>();
                categoriaMap.put("nombre", t.getCategoria().getNombre());
                taskData.put("categoria", categoriaMap);
            } else {
                taskData.put("categoria", null);
            }

            model.addAttribute("task", taskData);
            model.addAttribute("categoryId", t.getCategoria() != null ? t.getCategoria().getId() : null);
            model.addAttribute("isHistory", false);
            return "view-task";
        }
        return "redirect:/dashboard";
    }

    @GetMapping("/history")
    public String historyPage(Model model, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        model.addAttribute("userName", usuario.getNombre());
        return "history";
    }

    @GetMapping("/api/tasks/active")
    @ResponseBody
    public List<Map<String, Object>> getActiveTasks(Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        List<Tarea> tareas = tareaRepository.findByUsuarioIdAndEstadoNot(
            usuario.getId(), 
            Tarea.Estado.Completada
        );
        
        return tareas.stream().map(this::convertTareaToMap).collect(Collectors.toList());
    }

    @GetMapping("/api/tasks/completed")
    @ResponseBody
    public List<Map<String, Object>> getCompletedTasks(Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        List<Historial> historial = historialRepository.findByUsuarioIdAndAccionOrderByFechaDesc(
            usuario.getId(), 
            "Tarea completada"
        );
        
        return historial.stream().map(h -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", h.getTarea().getId());
            map.put("historialId", h.getId());
            map.put("title", h.getTitulo());
            map.put("description", h.getDescripcion() != null ? h.getDescripcion() : "");
            map.put("category", h.getCategoriaNombre() != null ? h.getCategoriaNombre() : "Sin categoría");
            map.put("dueDate", h.getFechaLimite() != null ? h.getFechaLimite().toString() : "");
            map.put("priority", h.getTarea().getPrioridad().toString().toUpperCase());
            map.put("status", "COMPLETADA");
            return map;
        }).collect(Collectors.toList());
    }

    @PostMapping("/tasks/{id}/restore")
    @ResponseBody
    public ResponseEntity<?> restoreTask(@PathVariable Integer id, Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            Optional<Tarea> tareaOpt = tareaRepository.findById(id);
            
            if (tareaOpt.isEmpty() || !tareaOpt.get().getUsuario().getId().equals(usuario.getId())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Tarea no encontrada"));
            }
            
            Tarea tarea = tareaOpt.get();
            
            // Cambiar el estado a Pendiente
            tarea.setEstado(Tarea.Estado.Pendiente);
            tareaRepository.save(tarea);
            
            // Eliminar los registros de "Tarea completada" del historial
            List<Historial> historialesCompletados = historialRepository.findByTareaIdAndAccion(
                tarea.getId(), 
                "Tarea completada"
            );
            
            if (!historialesCompletados.isEmpty()) {
                historialRepository.deleteAll(historialesCompletados);
            }
            
            // Registrar la restauración en el historial (opcional)
            historialRepository.save(new Historial(tarea, usuario, "Tarea restaurada"));
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Tarea restaurada al dashboard"));
        } catch (Exception e) {
            logger.error("Error restaurando tarea", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al restaurar la tarea"));
        }
    }

    @GetMapping("/view-history/{historialId}")
    public String viewHistoryTask(@PathVariable Integer historialId, Model model, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        model.addAttribute("userName", usuario.getNombre());
        
        Optional<Historial> historialOpt = historialRepository.findById(historialId);
        
        if (historialOpt.isPresent() && historialOpt.get().getUsuario().getId().equals(usuario.getId())) {
            Historial h = historialOpt.get();
            
            // Crear un objeto Map con los datos del historial para mostrar en la vista
            Map<String, Object> taskData = new HashMap<>();
            taskData.put("id", h.getTarea().getId());
            taskData.put("historialId", h.getId());
            taskData.put("titulo", h.getTitulo());
            taskData.put("descripcion", h.getDescripcion());
            taskData.put("fechaLimite", h.getFechaLimite());
            taskData.put("prioridad", h.getTarea().getPrioridad());
            taskData.put("estado", "Completada");

            // Para compatibilidad con la plantilla `view-task.html` que espera
            // `task.categoria.nombre`, construimos un objeto `categoria` con la
            // propiedad `nombre` cuando exista nombre de categoría en el historial.
            if (h.getCategoriaNombre() != null) {
                Map<String, Object> categoriaMap = new HashMap<>();
                categoriaMap.put("nombre", h.getCategoriaNombre());
                taskData.put("categoria", categoriaMap);
            } else {
                taskData.put("categoria", null);
            }

            model.addAttribute("task", taskData);
            model.addAttribute("isHistory", true);
            return "view-task";
        }
        
        return "redirect:/history";
    }

    @DeleteMapping("/tasks/{id}")
    @ResponseBody
    public Map<String, Boolean> deleteTask(@PathVariable Integer id, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        Optional<Tarea> tarea = tareaRepository.findById(id);
        
        if (tarea.isPresent() && tarea.get().getUsuario().getId().equals(usuario.getId())) {
            // Registrar eliminación en historial antes de borrar
            historialRepository.save(new Historial(tarea.get(), usuario, "Tarea eliminada"));
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
            Tarea.Estado estadoAnterior = tarea.getEstado();
            
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
                    Tarea.Prioridad prioridad = parsePrioridad(prioridadStr);
                    if (prioridad != null) {
                        tarea.setPrioridad(prioridad);
                    }
                } catch (Exception e) {
                    // mantener prioridad existente
                }
            }
            
            String estadoStr = (String) payload.get("status");
            if (estadoStr != null) {
                try {
                    Tarea.Estado estado = parseEstado(estadoStr);
                    if (estado != null) {
                        tarea.setEstado(estado);
                    }
                } catch (Exception e) {
                    // mantener estado existente
                }
            }
            
            // Actualizar categoría
            Object categoriaIdObj = payload.get("categoryId");
            if (categoriaIdObj != null) {
                if (categoriaIdObj.toString().isEmpty()) {
                    tarea.setCategoria(null);
                } else {
                    try {
                        Integer categoriaId = Integer.parseInt(categoriaIdObj.toString());
                        categoriaService.getCategoriaById(categoriaId, usuario)
                            .ifPresent(tarea::setCategoria);
                    } catch (Exception e) {
                        logger.warn("Error actualizando categoría", e);
                    }
                }
            }
            
            Tarea saved = tareaRepository.save(tarea);
            
            // Si la tarea se completó, guardar en historial
            if (saved.getEstado() == Tarea.Estado.Completada && estadoAnterior != Tarea.Estado.Completada) {
                historialRepository.save(new Historial(saved, usuario, "Tarea completada"));
            } else {
                // Registrar otros cambios
                String accion = "Tarea actualizada";
                if (estadoAnterior != saved.getEstado()) {
                    accion = "Estado cambiado de " + estadoAnterior + " a " + saved.getEstado();
                }
                historialRepository.save(new Historial(saved, usuario, accion));
            }
            
            return ResponseEntity.ok(convertTareaToMap(saved));
        } catch (Exception e) {
            logger.error("Error actualizando tarea", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al actualizar la tarea: " + e.getMessage()));
        }
    }
}