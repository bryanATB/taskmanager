package demo.controller;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import demo.model.Categoria;
import demo.model.Usuario;
import demo.repository.UsuarioRepository;
import demo.service.CategoriaService;

@Controller
public class CategoriaController {
    private static final Logger logger = LoggerFactory.getLogger(CategoriaController.class);
    
    @Autowired
    private CategoriaService categoriaService;

    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @GetMapping("/categories")
    public String categoriesPage(Model model, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        model.addAttribute("userName", usuario.getNombre());
        return "categories";
    }
    
    @GetMapping("/create-category")
    public String createCategoryPage(Model model, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        model.addAttribute("userName", usuario.getNombre());
        return "create-categories";
    }
    
    @GetMapping("/api/categories")
    @ResponseBody
    public List<Categoria> getAllCategories(Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        Usuario managedUser = usuarioRepository.findById(usuario.getId()).orElse(usuario);
        return categoriaService.getCategoriasByUsuario(managedUser);
    }
    
    @PostMapping("/api/categories")
    @ResponseBody
    public ResponseEntity<?> createCategory(@RequestBody Categoria categoria, Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            Usuario managedUser = usuarioRepository.findById(usuario.getId()).orElse(usuario);
            
            if (categoriaService.existsByNombre(categoria.getNombre(), managedUser)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Ya existe una categoría con ese nombre");
                return ResponseEntity.badRequest().body(error);
            }
            
            categoria.setUsuario(managedUser);
            Categoria savedCategoria = categoriaService.saveCategoria(categoria);
            return ResponseEntity.ok(savedCategoria);
        } catch (Exception e) {
            logger.error("Error creando categoría", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error al crear la categoría: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @DeleteMapping("/api/categories/{id}")
    @ResponseBody
    public ResponseEntity<?> deleteCategory(@PathVariable Integer id, Authentication auth) {
        try {
            Usuario usuario = (Usuario) auth.getPrincipal();
            Usuario managedUser = usuarioRepository.findById(usuario.getId()).orElse(usuario);
            Categoria categoria = categoriaService.getCategoriaById(id, managedUser)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada o no autorizada"));

            categoriaService.deleteCategoria(id);
            
            Map<String, Boolean> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error al eliminar la categoría");
            return ResponseEntity.badRequest().body(error);
        }
    }
}
