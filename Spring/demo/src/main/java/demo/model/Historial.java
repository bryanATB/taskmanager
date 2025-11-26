package demo.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "historial")
public class Historial {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarea_id", nullable = false)
    private Tarea tarea;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    
    // Campo 'accion' en DB: se restaura en la entidad para mantener compatibilidad
    // con la tabla. Se rellena con una cadena vacía o con la acción cuando aplique.
    @Column(name = "accion", nullable = false, length = 255)
    private String accion = "";

    @Column(nullable = false)
    private LocalDateTime fecha;
    
    // Nuevos campos para guardar datos de la tarea completada
    @Column(length = 150)
    private String titulo;
    
    @Column(columnDefinition = "TEXT")
    private String descripcion;
    
    @Column(name = "categoria_nombre", length = 50)
    private String categoriaNombre;
    
    @Column(name = "fecha_limite")
    private LocalDate fechaLimite;
    
    @Column(name = "fecha_inicio")  // ← AGREGAR ESTE CAMPO
    private LocalDate fechaInicio;
    
    @PrePersist
    protected void onCreate() {
        fecha = LocalDateTime.now();
    }
    
    public Historial() {}

    public Historial(Tarea tarea, Usuario usuario) {
        this.tarea = tarea;
        this.usuario = usuario;

        // Si la tarea está en estado "Completada", guardamos los datos relevantes
        if (tarea != null && tarea.getEstado() == Tarea.Estado.Completada) {
            this.titulo = tarea.getTitulo();
            this.descripcion = tarea.getDescripcion();
            this.fechaLimite = tarea.getFechaLimite();
            this.fechaInicio = tarea.getFechaInicio();
            if (tarea.getCategoria() != null) {
                this.categoriaNombre = tarea.getCategoria().getNombre();
            }
            // Mantener compatibilidad: marcar acción como completada
            this.accion = "Tarea completada";
        } else {
            // Valor por defecto no nulo para evitar errores si la columna es NOT NULL
            this.accion = "";
        }
    }
    
    // Getters y Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    
    public Tarea getTarea() { return tarea; }
    public void setTarea(Tarea tarea) { this.tarea = tarea; }
    
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    
    public String getAccion() { return accion; }
    public void setAccion(String accion) { this.accion = accion; }
    
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    
    public String getCategoriaNombre() { return categoriaNombre; }
    public void setCategoriaNombre(String categoriaNombre) { this.categoriaNombre = categoriaNombre; }
    
    public LocalDate getFechaLimite() { return fechaLimite; }
    public void setFechaLimite(LocalDate fechaLimite) { this.fechaLimite = fechaLimite; }
    
    // ← AGREGAR GETTER Y SETTER PARA FECHA INICIO
    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }
}