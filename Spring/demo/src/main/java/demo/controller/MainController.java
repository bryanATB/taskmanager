package demo.controller;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

import demo.UserService;
import demo.model.TaskStatsDTO;
import demo.model.Tarea;
import demo.model.Usuario;
import demo.repository.HistorialRepository;
import demo.repository.TareaRepository;

@Controller
public class MainController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private TareaRepository tareaRepository;
    
    @Autowired
    private HistorialRepository historialRepository;

    @GetMapping("/")
    public String showLoginForm() {
        return "index";
    }

    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        model.addAttribute("user", new Usuario());
        return "register";
    }

    @PostMapping("/register")
    public String registerUser(@ModelAttribute Usuario usuario) {
        usuario.setRole("USER");
        userService.registerUser(usuario);
        return "redirect:/?registered";
    }

    @GetMapping("/dashboard")
    public String showDashboard(Authentication auth, Model model) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        LocalDate hoy = LocalDate.now();
        
        // Calcular estadísticas
        TaskStatsDTO stats = new TaskStatsDTO();
        stats.setTotalActivas(tareaRepository.countActivasByUsuarioId(usuario.getId()));
        stats.setVencenHoy(tareaRepository.countVencenHoyByUsuarioId(usuario.getId(), hoy));
        stats.setPrioridadAlta(tareaRepository.countPrioridadAltaByUsuarioId(usuario.getId()));
        stats.setCompletadasHoy(tareaRepository.countCompletadasEnFecha(usuario.getId(), hoy));
        
        model.addAttribute("userName", usuario.getNombre());
        model.addAttribute("stats", stats);
        
        return "dashboard";
    }

    @GetMapping("/create-task")
    public String showCreateTaskForm(Authentication auth, Model model) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        model.addAttribute("userName", usuario.getNombre());
        model.addAttribute("task", new Tarea());
        return "create-task";
    }
}