package demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import demo.model.Categoria;
import demo.model.Usuario;
import demo.repository.CategoriaRepository;

@Service
public class CategoriaService {
    
    @Autowired
    private CategoriaRepository categoriaRepository;
    
    public List<Categoria> getCategoriasByUsuario(Usuario usuario) {
        return categoriaRepository.findByUsuario(usuario);
    }
    
    public Optional<Categoria> getCategoriaById(Integer id, Usuario usuario) {
        return categoriaRepository.findByIdAndUsuario(id, usuario);
    }
    
    public Categoria saveCategoria(Categoria categoria) {
        return categoriaRepository.save(categoria);
    }
    
    public void deleteCategoria(Integer id) {
        categoriaRepository.deleteById(id);
    }
    
    public boolean existsByNombre(String nombre, Usuario usuario) {
        return categoriaRepository.existsByNombreAndUsuario(nombre, usuario);
    }
}