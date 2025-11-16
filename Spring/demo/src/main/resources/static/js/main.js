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
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: red;">Error al cargar las tareas</td></tr>';
        }
    }
}

// Función para renderizar las tareas en la tabla
function renderTasks(tasks) {
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (!tasks || tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay tareas aún. <a href="/create-task">Crea una nueva</a></td></tr>';
        return;
    }

    tasks.forEach(task => {
        const tr = document.createElement('tr');
        
        // Formatear prioridad con color
        let prioridadClass = '';
        let prioridadText = task.priority || 'MEDIA';
        if (prioridadText === 'ALTA') prioridadClass = 'style="color: #ef4444; font-weight: 600;"';
        else if (prioridadText === 'BAJA') prioridadClass = 'style="color: #6b7280;"';
        
        // Formatear estado con color
        let estadoClass = '';
        let estadoText = task.status || 'PENDIENTE';
        if (estadoText.includes('COMPLETADA')) estadoClass = 'style="color: #10b981; font-weight: 600;"';
        else if (estadoText.includes('PROGRESO')) estadoClass = 'style="color: #f59e0b; font-weight: 600;"';
        
        tr.innerHTML = `
            <td data-label="Título">${escapeHtml(task.title)}</td>
            <td data-label="Fecha">${formatDate(task.dueDate)}</td>
            <td data-label="Prioridad" ${prioridadClass}>${prioridadText}</td>
            <td data-label="Estado" ${estadoClass}>${estadoText}</td>
            <td data-label="Acciones" class="actions">
                <a href="/view-task/${task.id}" class="btn btn-ghost">Ver</a>
                <a href="/edit-task/${task.id}" class="btn btn-ghost">Editar</a>
                <button onclick="deleteTask(${task.id})" class="btn" style="background:#ef4444;">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
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
            alert(msg);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar la tarea');
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
                loadTasks();
            } else {
                alert('Error al eliminar la tarea');
            }
        } else {
            alert('Error al eliminar la tarea');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la tarea');
    }
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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando...');
    
    // Cargar tareas si estamos en el dashboard
    const tasksTableBody = document.getElementById('tasksTableBody');
    if (tasksTableBody) {
        console.log('Cargando tareas...');
        loadTasks();
    }

    // Configurar formulario de tarea si existe
    const taskForm = document.querySelector('form#taskForm');
    if (taskForm) {
        console.log('Configurando formulario de tarea...');
        taskForm.addEventListener('submit', handleTaskForm);
    }
});