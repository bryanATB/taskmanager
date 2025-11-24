// proyectos.js - JavaScript para gestión de proyectos

const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

function makeHeaders() {
    const headers = { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
    };
    if (csrfHeader && csrfToken) {
        headers[csrfHeader] = csrfToken;
    }
    return headers;
}

// Cargar proyectos
async function loadProyectos() {
    try {
        const response = await fetch('/api/proyectos', { 
            headers: makeHeaders() 
        });
        
        if (!response.ok) {
            throw new Error('No se pudieron cargar los proyectos');
        }
        
        const proyectos = await response.json();
        renderProyectos(proyectos);
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
        const grid = document.getElementById('proyectosGrid');
        if (grid) {
            grid.innerHTML = '<div class="empty-state"><p style="color: #ef4444;">Error al cargar los proyectos</p></div>';
        }
    }
}

// Renderizar proyectos
function renderProyectos(proyectos) {
    const grid = document.getElementById('proyectosGrid');
    if (!grid) return;

    grid.innerHTML = '';
    
    if (!proyectos || proyectos.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i data-lucide="folder-x"></i>
                <h3>No hay proyectos aún</h3>
                <p>Crea tu primer proyecto para organizar mejor tus tareas</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    proyectos.forEach(proyecto => {
        const card = createProyectoCard(proyecto);
        grid.appendChild(card);
    });
    
    lucide.createIcons();
}

// Crear tarjeta de proyecto
function createProyectoCard(proyecto) {
    const card = document.createElement('div');
    card.className = 'proyecto-card';
    card.style.setProperty('--proyecto-color', proyecto.color || '#3b82f6');
    
    const fechaInicio = proyecto.fechaInicio ? formatFecha(proyecto.fechaInicio) : 'Sin fecha';
    const fechaFin = proyecto.fechaFin ? formatFecha(proyecto.fechaFin) : 'Sin fecha';
    const estadoClass = proyecto.estado.toLowerCase();
    
    card.innerHTML = `
        <div class="proyecto-header-card">
            <div class="proyecto-color-dot" style="background-color: ${proyecto.color || '#3b82f6'}"></div>
            <div class="proyecto-info-card">
                <h3 class="proyecto-nombre">${escapeHtml(proyecto.nombre)}</h3>
                <p class="proyecto-descripcion-card">${escapeHtml(proyecto.descripcion || 'Sin descripción')}</p>
            </div>
        </div>
        
        <div class="proyecto-stats-card">
            <div class="stat-item-card">
                <span class="stat-label-card">Fecha Inicio</span>
                <span class="stat-value-card">${fechaInicio}</span>
            </div>
            <div class="stat-item-card">
                <span class="stat-label-card">Fecha Fin</span>
                <span class="stat-value-card">${fechaFin}</span>
            </div>
            <div class="stat-item-card">
                <span class="stat-label-card">Tareas</span>
                <span class="stat-value-card">${proyecto.cantidadTareas || 0}</span>
            </div>
            <div class="stat-item-card">
                <span class="stat-label-card">Estado</span>
                <span class="badge-estado ${estadoClass}">${proyecto.estado}</span>
            </div>
        </div>
        
        <div class="proyecto-actions-card">
            <button class="btn-card btn-ver" onclick="window.location.href='/view-proyecto/${proyecto.id}'">
                <i data-lucide="eye"></i>
                Ver Detalles
            </button>
            <button class="btn-card btn-eliminar" onclick="deleteProyecto(${proyecto.id}, event)">
                <i data-lucide="trash-2"></i>
                Eliminar
            </button>
        </div>
    `;
    
    return card;
}

// Eliminar proyecto
async function deleteProyecto(id, event) {
    event.stopPropagation();
    
    if (!confirm('¿Estás seguro de que quieres eliminar este proyecto? Las tareas no se eliminarán.')) {
        return;
    }

    try {
        const response = await fetch(`/api/proyectos/${id}`, {
            method: 'DELETE',
            headers: makeHeaders()
        });

        if (response.ok) {
            showNotification('Proyecto eliminado correctamente', 'success');
            loadProyectos();
        } else {
            showNotification('Error al eliminar el proyecto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar el proyecto', 'error');
    }
}

// Manejar formulario de proyecto
async function handleProyectoForm(event) {
    event.preventDefault();
    const form = event.target;
    
    const proyecto = {
        nombre: form.querySelector('#nombre').value,
        descripcion: form.querySelector('#descripcion').value,
        color: form.querySelector('#color').value,
        fechaInicio: form.querySelector('#fechaInicio').value || null,
        fechaFin: form.querySelector('#fechaFin').value || null
    };

    try {
        const response = await fetch('/api/proyectos', {
            method: 'POST',
            headers: makeHeaders(),
            body: JSON.stringify(proyecto)
        });

        if (response.ok) {
            window.location.href = '/proyectos';
        } else {
            const err = await response.json();
            showNotification(err.error || 'Error al crear el proyecto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al crear el proyecto', 'error');
    }
}

function formatFecha(dateStr) {
    if (!dateStr) return 'Sin fecha';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
        });
    } catch (e) {
        return dateStr;
    }
}

function showNotification(message, type = 'info') {
    alert(message);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    const proyectosGrid = document.getElementById('proyectosGrid');
    if (proyectosGrid) {
        loadProyectos();
    }

    const proyectoForm = document.querySelector('form#proyectoForm');
    if (proyectoForm) {
        proyectoForm.addEventListener('submit', handleProyectoForm);
        
        // Actualizar el valor del color en tiempo real
        const colorInput = document.getElementById('color');
        const colorValue = document.getElementById('colorValue');
        if (colorInput && colorValue) {
            colorInput.addEventListener('input', (e) => {
                colorValue.textContent = e.target.value;
                colorValue.style.color = e.target.value;
            });
        }
    }
});