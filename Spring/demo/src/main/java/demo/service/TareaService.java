package demo.service;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import demo.model.Tarea;
import demo.model.Tarea.Estado;
import demo.repository.TareaRepository;

@Service
public class TareaService {
    
    private static final Logger logger = LoggerFactory.getLogger(TareaService.class);
    
    @Autowired
    private TareaRepository tareaRepository;
    
    /**
     * Marcar tareas vencidas como incompletas
     * Se ejecuta todos los días a medianoche (00:00)
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void marcarTareasVencidasComoIncompletas() {
        logger.info("🔍 Iniciando verificación de tareas vencidas...");
        
        LocalDate hoy = LocalDate.now();
        
        // Obtener todas las tareas activas (no completadas ni incompletas)
        List<Tarea> todasLasTareas = tareaRepository.findAll();
        
        int tareasActualizadas = 0;
        
        for (Tarea tarea : todasLasTareas) {
            // Solo procesar tareas que:
            // 1. Tengan fecha límite
            // 2. No estén completadas
            // 3. No estén ya marcadas como incompletas
            // 4. La fecha límite haya pasado
            if (tarea.getFechaLimite() != null 
                && tarea.getEstado() != Estado.Completada 
                && tarea.getEstado() != Estado.Incompleta
                && tarea.getFechaLimite().isBefore(hoy)) {
                
                logger.info("⚠️ Marcando tarea como incompleta: {} (Venció el: {})", 
                    tarea.getTitulo(), tarea.getFechaLimite());
                
                tarea.setEstado(Estado.Incompleta);
                tareaRepository.save(tarea);
                tareasActualizadas++;
            }
        }
        
        logger.info("✅ Verificación completada. {} tarea(s) marcadas como incompletas", tareasActualizadas);
    }
    
    /**
     * Método manual para marcar tareas vencidas
     * (útil para testing o ejecución manual)
     */
    @Transactional
    public int marcarTareasVencidasManual() {
        LocalDate hoy = LocalDate.now();
        List<Tarea> todasLasTareas = tareaRepository.findAll();
        
        int contador = 0;
        for (Tarea tarea : todasLasTareas) {
            if (tarea.getFechaLimite() != null 
                && tarea.getEstado() != Estado.Completada 
                && tarea.getEstado() != Estado.Incompleta
                && tarea.getFechaLimite().isBefore(hoy)) {
                
                tarea.setEstado(Estado.Incompleta);
                tareaRepository.save(tarea);
                contador++;
            }
        }
        
        return contador;
    }
}