// main.js - JavaScript para la gestión de tareas

// Obtener el token CSRF
const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

// Configuración para las peticiones fetch
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

// Función para cargar las tareas
async function loadTasks() {
    try {
        const response = await fetch('/tasks', { 
            headers: makeHeaders() 
        });
        
        if (!response.ok) {
            throw new Error('No se pudo cargar tareas');
        }
        
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Error al cargar las tareas:', error);
        const tbody = document.getElementById('tasksTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: #ef4444;">Error al cargar las tareas</td></tr>';
        }
    }
}

// Función para renderizar las tareas en la tabla
function renderTasks(tasks) {
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (!tasks || tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay tareas aún. <a href="/create-task" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Crea una nueva</a></td></tr>';
        return;
    }

    tasks.forEach(task => {
        const tr = document.createElement('tr');
        
        // Formatear prioridad con badge
        let prioridadBadge = getPriorityBadge(task.priority || 'MEDIA');
        
        // Formatear estado con badge
        let estadoBadge = getStatusBadge(task.status || 'PENDIENTE');
        
        tr.innerHTML = `
            <td>
                <span style="font-weight: 500; color: #0f172a;">${escapeHtml(task.title)}</span>
            </td>
            <td style="color: #64748b;">${formatDate(task.dueDate)}</td>
            <td>${prioridadBadge}</td>
            <td>${estadoBadge}</td>
            <td>
                <div class="action-buttons-table">
                    <a href="/view-task/${task.id}" class="btn-table btn-view">Ver</a>
                    <a href="/edit-task/${task.id}" class="btn-table btn-edit">Editar</a>
                    <button onclick="deleteTask(${task.id})" class="btn-table btn-delete">Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Función para crear badge de prioridad
function getPriorityBadge(priority) {
    const styles = {
        'ALTA': 'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;',
        'MEDIA': 'background: #fef3c7; color: #d97706; border: 1px solid #fde68a;',
        'BAJA': 'background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe;'
    };
    
    const style = styles[priority] || styles['MEDIA'];
    return `<span class="badge" style="${style}">${priority}</span>`;
}

// Función para crear badge de estado
function getStatusBadge(status) {
    const styles = {
        'COMPLETADA': 'background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0;',
        'EN_PROGRESO': 'background: #fef3c7; color: #d97706; border: 1px solid #fde68a;',
        'PENDIENTE': 'background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;'
    };
    
    const displayText = {
        'COMPLETADA': 'Completada',
        'EN_PROGRESO': 'En Progreso',
        'PENDIENTE': 'Pendiente'
    };
    
    const style = styles[status] || styles['PENDIENTE'];
    const text = displayText[status] || status;
    return `<span class="badge" style="${style}">${text}</span>`;
}

// Función para manejar el formulario de creación/edición de tareas
async function handleTaskForm(event) {
    event.preventDefault();
    const form = event.target;
    const isEdit = form.dataset.taskId;
    
    const task = {
        title: form.querySelector('#title').value,
        description: form.querySelector('#description').value,
        dueDate: form.querySelector('#dueDate').value,
        status: form.querySelector('#status').value,
        priority: form.querySelector('#priority')?.value
    };

    try {
        const url = isEdit ? `/tasks/${form.dataset.taskId}` : '/save-task';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            headers: makeHeaders(),
            method: method,
            body: JSON.stringify(task)
        });

        if (response.ok) {
            window.location.href = '/dashboard';
        } else {
            let msg = 'Error al guardar la tarea';
            try {
                const err = await response.json();
                if (err && err.error) {
                    msg = err.error;
                }
            } catch (e) {
                // Si no puede parsear JSON, usar mensaje por defecto
            }
            showNotification(msg, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al guardar la tarea', 'error');
    }
}

// Función para eliminar una tarea
async function deleteTask(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        return;
    }

    try {
        const response = await fetch(`/tasks/${id}`, {
            headers: makeHeaders(),
            method: 'DELETE'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showNotification('Tarea eliminada correctamente', 'success');
                loadTasks();
            } else {
                showNotification('Error al eliminar la tarea', 'error');
            }
        } else {
            showNotification('Error al eliminar la tarea', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar la tarea', 'error');
    }
}

// Función para mostrar notificaciones (opcional)
function showNotification(message, type = 'info') {
    // Por ahora usamos alert, pero puedes implementar toast notifications
    alert(message);
}

// Función para formatear fechas
function formatDate(dateStr) {
    if (!dateStr) return 'Sin fecha';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return dateStr;
    }
}

// Función para escapar HTML y prevenir XSS
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Funcionalidad de búsqueda en tiempo real
function initializeSearch() {
    const searchInput = document.querySelector('.b');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#tasksTableBody tr');
        
        rows.forEach(row => {
            const title = row.querySelector('td:first-child')?.textContent.toLowerCase() || '';
            if (title.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando...');
    
    // Cargar tareas si estamos en el dashboard
    const tasksTableBody = document.getElementById('tasksTableBody');
    if (tasksTableBody) {
        console.log('Cargando tareas...');
        loadTasks();
        initializeSearch();
    }

    // Configurar formulario de tarea si existe
    const taskForm = document.querySelector('form#taskForm');
    if (taskForm) {
        console.log('Configurando formulario de tarea...');
        taskForm.addEventListener('submit', handleTaskForm);
    }
});