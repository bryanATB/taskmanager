package demo.model;

public class TaskStatsDTO {
    private long totalActivas;
    private long vencenHoy;
    private long completadasHoy;
    private long prioridadAlta;
    
    public TaskStatsDTO() {}
    
    public TaskStatsDTO(long totalActivas, long vencenHoy, long completadasHoy, long prioridadAlta) {
        this.totalActivas = totalActivas;
        this.vencenHoy = vencenHoy;
        this.completadasHoy = completadasHoy;
        this.prioridadAlta = prioridadAlta;
    }
    
    // Getters y Setters
    public long getTotalActivas() {
        return totalActivas;
    }
    
    public void setTotalActivas(long totalActivas) {
        this.totalActivas = totalActivas;
    }
    
    public long getVencenHoy() {
        return vencenHoy;
    }
    
    public void setVencenHoy(long vencenHoy) {
        this.vencenHoy = vencenHoy;
    }
    
    public long getCompletadasHoy() {
        return completadasHoy;
    }
    
    public void setCompletadasHoy(long completadasHoy) {
        this.completadasHoy = completadasHoy;
    }
    
    public long getPrioridadAlta() {
        return prioridadAlta;
    }
    
    public void setPrioridadAlta(long prioridadAlta) {
        this.prioridadAlta = prioridadAlta;
    }
}