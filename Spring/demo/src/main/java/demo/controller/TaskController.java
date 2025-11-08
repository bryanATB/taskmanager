package demo.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
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

import demo.model.Task;
import demo.model.User;
import demo.repository.TaskRepository;
import demo.repository.UserRepository;

@Controller
public class TaskController {
    private static final Logger logger = LoggerFactory.getLogger(TaskController.class);
    
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/create-task")
    public String showCreateTaskForm(Model model) {
        model.addAttribute("task", new Task());
        return "create-task";
    }

    @PostMapping("/save-task")
    @ResponseBody
    public org.springframework.http.ResponseEntity<?> saveTask(jakarta.servlet.http.HttpServletRequest request, Authentication auth) {
        User user = (User) auth.getPrincipal();
        Task task = new Task();
        try {
            // Log incoming request for debugging
            logger.debug("saveTask - contentType={}", request.getContentType());
            logger.debug("saveTask - params: title={}, priority={}, status={}, dueDate={}", request.getParameter("title"), request.getParameter("priority"), request.getParameter("status"), request.getParameter("dueDate"));
            String contentType = request.getContentType();
            if (contentType != null && contentType.contains("application/json")) {
                // JSON payload (from fetch)
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                // try to accept common date-time formats
                java.text.DateFormat df1 = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm");
                java.text.DateFormat df2 = new java.text.SimpleDateFormat("yyyy-MM-dd");
                mapper.setDateFormat(df1);
                String body = request.getReader().lines().reduce((a, b) -> a + "\n" + b).orElse("");
                logger.debug("saveTask - raw body: {}", body);
                // try parsing directly
                try {
                    task = mapper.readValue(body, Task.class);
                } catch (Exception ex) {
                    // fallback: try with alternative date format
                    mapper.setDateFormat(df2);
                    task = mapper.readValue(body, Task.class);
                }
            } else {
                // form submit (application/x-www-form-urlencoded)
                String title = request.getParameter("title");
                String description = request.getParameter("description");
                String dueDateStr = request.getParameter("dueDate");
                String priority = request.getParameter("priority");
                String status = request.getParameter("status");

                task.setTitle(title);
                task.setDescription(description);
                task.setPriority(priority);
                task.setStatus(status);

                if (dueDateStr != null && !dueDateStr.isEmpty()) {
                    // datetime-local -> e.g. 2025-11-06T10:29
                    java.util.Date due = null;
                    try {
                        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm");
                        due = sdf.parse(dueDateStr);
                    } catch (Exception e) {
                        try {
                            java.text.SimpleDateFormat sdf2 = new java.text.SimpleDateFormat("yyyy-MM-dd");
                            due = sdf2.parse(dueDateStr);
                        } catch (Exception ex) {
                            // ignore parse error, leave due null
                        }
                    }
                    task.setDueDate(due);
                }
            }

            // ensure we attach a managed User entity to avoid FK issues
            User managedUser = userRepository.findById(user.getId()).orElse(null);
            if (managedUser == null) {
                // try to find by email as fallback
                managedUser = userRepository.findByEmail(user.getEmail());
            }
            if (managedUser == null) {
                throw new IllegalStateException("Authenticated user not found in database");
            }
            task.setUser(managedUser);
            Task saved = taskRepository.save(task);
            return org.springframework.http.ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            java.util.Map<String, String> body = java.util.Map.of("error", "Error saving task: " + e.getMessage());
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(body);
        }
    }

    // Fallback handler for classic form submissions (application/x-www-form-urlencoded)
    @PostMapping(value = "/save-task", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public String saveTaskForm(@RequestParam Map<String, String> params, Authentication auth, RedirectAttributes redirectAttributes) {
        try {
            User user = (User) auth.getPrincipal();
            Task task = new Task();
            task.setTitle(params.get("title"));
            task.setDescription(params.get("description"));
            task.setPriority(params.get("priority"));
            task.setStatus(params.get("status"));
            String dueDateStr = params.get("dueDate");
            if (dueDateStr != null && !dueDateStr.isEmpty()) {
                try {
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm");
                    task.setDueDate(sdf.parse(dueDateStr));
                } catch (Exception e) {
                    try {
                        java.text.SimpleDateFormat sdf2 = new java.text.SimpleDateFormat("yyyy-MM-dd");
                        task.setDueDate(sdf2.parse(dueDateStr));
                    } catch (Exception ex) {
                        // ignore
                    }
                }
            }
            User managedUser2 = userRepository.findById(user.getId()).orElse(null);
            if (managedUser2 == null) {
                managedUser2 = userRepository.findByEmail(user.getEmail());
            }
            if (managedUser2 == null) {
                throw new IllegalStateException("Authenticated user not found in database");
            }
            task.setUser(managedUser2);
            taskRepository.save(task);
            redirectAttributes.addFlashAttribute("success", "Tarea guardada correctamente");
            return "redirect:/dashboard";
        } catch (Exception e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("error", "Error guardando la tarea: " + e.getMessage());
            return "redirect:/create-task";
        }
    }

    @GetMapping("/tasks")
    @ResponseBody
    public List<Task> getTasks(Authentication auth) {
        User user = (User) auth.getPrincipal();
        return taskRepository.findByUser(user);
    }

    @GetMapping("/edit-task/{id}")
    public String showEditTaskForm(@PathVariable Long id, Model model, Authentication auth) {
        User user = (User) auth.getPrincipal();
        Optional<Task> task = taskRepository.findById(id);
        if (task.isPresent() && task.get().getUser().getId().equals(user.getId())) {
            model.addAttribute("task", task.get());
            return "edit-task";
        }
        return "redirect:/dashboard";
    }

    @GetMapping("/view-task/{id}")
    public String viewTask(@PathVariable Long id, Model model, Authentication auth) {
        User user = (User) auth.getPrincipal();
        Optional<Task> task = taskRepository.findById(id);
        if (task.isPresent() && task.get().getUser().getId().equals(user.getId())) {
            model.addAttribute("task", task.get());
            return "view-task";
        }
        return "redirect:/dashboard";
    }

    @DeleteMapping("/tasks/{id}")
    @ResponseBody
    public Map<String, Boolean> deleteTask(@PathVariable Long id, Authentication auth) {
        User user = (User) auth.getPrincipal();
        Optional<Task> task = taskRepository.findById(id);
        if (task.isPresent() && task.get().getUser().getId().equals(user.getId())) {
            taskRepository.deleteById(id);
            return Map.of("success", true);
        }
        return Map.of("success", false);
    }

    @PutMapping("/tasks/{id}")
    @ResponseBody
    public Task updateTask(@PathVariable Long id, @RequestBody Task updatedTask, Authentication auth) {
        User user = (User) auth.getPrincipal();
        Optional<Task> existingTask = taskRepository.findById(id);
        if (existingTask.isPresent() && existingTask.get().getUser().getId().equals(user.getId())) {
            updatedTask.setId(id);
            updatedTask.setUser(user);
            return taskRepository.save(updatedTask);
        }
        throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Tarea no encontrada o no autorizada");
    }
}