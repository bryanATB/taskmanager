package demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import demo.UserService;
import demo.model.User;

@Controller
public class MainController {

    @Autowired
    private UserService userService;

    @GetMapping("/")
    public String showLoginForm() {
        return "index";
    }

    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        model.addAttribute("user", new User());
        return "register";
    }

    @PostMapping("/register")
    public String registerUser(@ModelAttribute User user) {
        // Asignar rol de usuario por defecto
        user.setRole("USER");
        userService.registerUser(user);
        return "redirect:/?registered";
    }

    @GetMapping("/dashboard")
    public String showDashboard(Authentication auth, Model model) {
        User user = (User) auth.getPrincipal();
        model.addAttribute("userName", user.getName());
        return "dashboard";
    }
}
