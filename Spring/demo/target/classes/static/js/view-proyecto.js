// Obtener CSRF token
const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

// Elementos del DOM
const loadingState = document.getElementById('loadingState');
const proyectoContent = document.getElementById('proyectoContent');
const modal = document.getElementById('modalAgregarTarea');

// Elementos del proyecto
const proyectoColor = document.getElementById('proyectoColor');
const proyectoNombre = document.getElementById('proyectoNombre');
const proyectoDescripcion = document.getElementById('proyectoDescripcion');
const proyectoFechaInicio = document.getElementById('proyectoFechaInicio');
const proyectoFechaFin = document.getElementById('proyectoFechaFin');
const proyectoTotalTareas = document.getElementById('proyectoTotalTareas');
const proyectoEstado = document.getElementById('proyectoEstado');
const tareasContainer = document.getElementById('tareasContainer');

// Botones
const btnEliminarProyecto = document.getElementById('btnEliminarProyecto');

// Variable para guardar las tareas del proyecto
let tareasDelProyecto = [];

// Cargar proyecto al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarProyecto();
    
    // Agregar evento al botón de agregar tarea
    const btnAgregarTarea = document.getElementById('btnAgregarTarea');
    if (btnAgregarTarea) {
        btnAgregarTarea.addEventListener('click', async () => {
            modal.classList.add('show');
            await cargarTareasDisponibles();
        });
    }
});

// Cargar datos del proyecto
async function cargarProyecto() {
    try {
        const response = await fetch(`/api/proyectos/${proyectoId}`, {
            headers: {
                [csrfHeader]: csrfToken
            }
        });
        
        if (!response.ok) {
            throw new Error('Proyecto no encontrado');
        }
        
        const proyecto = await response.json();
        mostrarProyecto(proyecto);
        
    } catch (error) {
        console.error('Error al cargar proyecto:', error);
        loadingState.innerHTML = `
            <i data-lucide="alert-circle"></i>
            <p>Error al cargar el proyecto</p>
        `;
        lucide.createIcons();
    }
}

// Mostrar datos del proyecto
function mostrarProyecto(proyecto) {
    // Actualizar header
    proyectoColor.style.backgroundColor = proyecto.color || '#3b82f6';
    proyectoNombre.textContent = proyecto.nombre;
    proyectoDescripcion.textContent = proyecto.descripcion || 'Sin descripción';
    
    // Actualizar stats
    proyectoFechaInicio.textContent = proyecto.fechaInicio 
        ? formatearFecha(proyecto.fechaInicio) 
        : '-';
    
    proyectoFechaFin.textContent = proyecto.fechaFin 
        ? formatearFecha(proyecto.fechaFin) 
        : '-';
    
    proyectoTotalTareas.textContent = proyecto.tareas ? proyecto.tareas.length : 0;
    proyectoEstado.textContent = formatearEstado(proyecto.estado);
    
    // Guardar tareas del proyecto
    tareasDelProyecto = proyecto.tareas || [];
    
    // Mostrar tareas
    mostrarTareas(tareasDelProyecto);
    
    // Ocultar loading y mostrar contenido
    loadingState.style.display = 'none';
    proyectoContent.style.display = 'block';
    
    lucide.createIcons();
}

// Mostrar lista de tareas
function mostrarTareas(tareas) {
    if (tareas.length === 0) {
        tareasContainer.innerHTML = '<p class="empty-message">No hay tareas en este proyecto</p>';
        return;
    }
    
    tareasContainer.innerHTML = tareas.map(tarea => `
        <div class="tarea-item">
            <div class="tarea-info">
                <span class="tarea-titulo">${tarea.titulo}</span>
                <div class="tarea-badges">
                    <span class="badge badge-estado ${tarea.estado}">${formatearEstadoTarea(tarea.estado)}</span>
                    <span class="badge badge-prioridad ${tarea.prioridad}">${formatearPrioridad(tarea.prioridad)}</span>
                </div>
            </div>
            <div class="tarea-actions">
                <button class="btn-icon btn-view" onclick="verTarea(${tarea.id})" title="Ver detalles de la tarea">
                    <i data-lucide="eye"></i>
                </button>
                <button class="btn-icon btn-remove" onclick="removerTarea(${tarea.id})" title="Remover del proyecto">
                    <i data-lucide="x"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// Formatear fecha
function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Formatear estado del proyecto
function formatearEstado(estado) {
    const estados = {
        'ACTIVO': 'Activo',
        'PAUSADO': 'Pausado',
        'COMPLETADO': 'Completado'
    };
    return estados[estado] || estado;
}

// Formatear estado de tarea
function formatearEstadoTarea(estado) {
    const estados = {
        'PENDIENTE': 'Pendiente',
        'EN_PROGRESO': 'En Progreso',
        'COMPLETADA': 'Completada'
    };
    return estados[estado] || estado;
}

// Formatear prioridad
function formatearPrioridad(prioridad) {
    const prioridades = {
        'ALTA': 'Alta',
        'MEDIA': 'Media',
        'BAJA': 'Baja'
    };
    return prioridades[prioridad] || prioridad;
}

// Cerrar modal
function cerrarModal() {
    modal.classList.remove('show');
}

// Cerrar modal al hacer clic fuera
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        cerrarModal();
    }
});

// Cargar tareas disponibles
async function cargarTareasDisponibles() {
    const selectTarea = document.getElementById('selectTarea');
    selectTarea.innerHTML = '<option value="">Cargando tareas...</option>';
    
    console.log('=== INICIANDO CARGA DE TAREAS ===');
    
    try {
        // Cargar todas las tareas del usuario
        const response = await fetch('/tasks', {
            method: 'GET',
            headers: {
                [csrfHeader]: csrfToken
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const todasLasTareas = await response.json();
        console.log('✅ Tareas cargadas:', todasLasTareas.length);
        
        if (!Array.isArray(todasLasTareas)) {
            throw new Error('La respuesta no es un array');
        }
        
        // Filtrar tareas que NO están en el proyecto
        const tareasDisponibles = todasLasTareas.filter(tarea => {
            const estaEnProyecto = tareasDelProyecto.some(t => t.id === tarea.id);
            return !estaEnProyecto;
        });
        
        console.log('✅ Tareas disponibles:', tareasDisponibles.length);
        
        if (tareasDisponibles.length === 0) {
            selectTarea.innerHTML = '<option value="">No hay tareas disponibles para agregar</option>';
            return;
        }
        
        const options = '<option value="">Selecciona una tarea</option>' +
            tareasDisponibles.map(tarea => 
                `<option value="${tarea.id}">${tarea.title || 'Sin título'}</option>`
            ).join('');
        
        selectTarea.innerHTML = options;
        console.log('✅ Select actualizado correctamente');
            
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        selectTarea.innerHTML = '<option value="">Error al cargar tareas</option>';
    }
}

// Agregar tarea al proyecto
async function agregarTareaAlProyecto() {
    const selectTarea = document.getElementById('selectTarea');
    const tareaId = selectTarea.value;
    
    if (!tareaId) {
        alert('Por favor selecciona una tarea');
        return;
    }
    
    try {
        const response = await fetch(`/api/proyectos/${proyectoId}/tareas/${tareaId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [csrfHeader]: csrfToken
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al agregar la tarea');
        }
        
        cerrarModal();
        cargarProyecto(); // Recargar proyecto
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar la tarea al proyecto');
    }
}

// Remover tarea del proyecto
async function removerTarea(tareaId) {
    if (!confirm('¿Estás seguro de remover esta tarea del proyecto?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/proyectos/${proyectoId}/tareas/${tareaId}`, {
            method: 'DELETE',
            headers: {
                [csrfHeader]: csrfToken
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al remover la tarea');
        }
        
        cargarProyecto(); // Recargar proyecto
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al remover la tarea del proyecto');
    }
}

// Eliminar proyecto
btnEliminarProyecto.addEventListener('click', async () => {
    if (!confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/proyectos/${proyectoId}`, {
            method: 'DELETE',
            headers: {
                [csrfHeader]: csrfToken
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el proyecto');
        }
        
        // Redirigir a la lista de proyectos
        window.location.href = '/proyectos';
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el proyecto');
    }
});

// Ver detalles de la tarea
function verTarea(tareaId) {
    window.location.href = `/view-task/${tareaId}`;
}