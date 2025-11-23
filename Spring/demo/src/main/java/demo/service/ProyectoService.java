package demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import demo.model.Proyecto;
import demo.model.Proyecto.EstadoProyecto;
import demo.model.Tarea;
import demo.model.Usuario;
import demo.repository.ProyectoRepository;
import demo.repository.TareaRepository;

@Service
public class ProyectoService {
    
    @Autowired
    private ProyectoRepository proyectoRepository;
    
    @Autowired
    private TareaRepository tareaRepository;
    
    public List<Proyecto> getProyectosByUsuario(Usuario usuario) {
        return proyectoRepository.findByUsuario(usuario);
    }
    
    public List<Proyecto> getProyectosActivosByUsuario(Usuario usuario) {
        return proyectoRepository.findByUsuarioAndEstado(usuario, EstadoProyecto.ACTIVO);
    }
    
    public Optional<Proyecto> getProyectoById(Integer id, Usuario usuario) {
        return proyectoRepository.findByIdAndUsuario(id, usuario);
    }
    
    public Optional<Proyecto> getProyectoWithTareas(Integer id, Usuario usuario) {
        return proyectoRepository.findByIdAndUsuarioWithTareas(id, usuario);
    }
    
    public Proyecto saveProyecto(Proyecto proyecto) {
        return proyectoRepository.save(proyecto);
    }
    
    @Transactional
    public void deleteProyecto(Integer id) {
        proyectoRepository.deleteById(id);
    }
    
    @Transactional
    public void agregarTareaAProyecto(Integer proyectoId, Integer tareaId, Usuario usuario) {
        Optional<Proyecto> proyectoOpt = proyectoRepository.findByIdAndUsuarioWithTareas(proyectoId, usuario);
        Optional<Tarea> tareaOpt = tareaRepository.findById(tareaId);
        
        if (proyectoOpt.isPresent() && tareaOpt.isPresent()) {
            Proyecto proyecto = proyectoOpt.get();
            Tarea tarea = tareaOpt.get();
            
            if (!proyecto.getTareas().contains(tarea)) {
                proyecto.getTareas().add(tarea);
                proyectoRepository.save(proyecto);
            }
        }
    }
    
    @Transactional
    public void removerTareaDeProyecto(Integer proyectoId, Integer tareaId, Usuario usuario) {
        Optional<Proyecto> proyectoOpt = proyectoRepository.findByIdAndUsuarioWithTareas(proyectoId, usuario);
        
        if (proyectoOpt.isPresent()) {
            Proyecto proyecto = proyectoOpt.get();
            proyecto.getTareas().removeIf(t -> t.getId().equals(tareaId));
            proyectoRepository.save(proyecto);
        }
    }
    
    public long countProyectosActivos(Integer usuarioId) {
        return proyectoRepository.countActivosByUsuarioId(usuarioId);
    }
}