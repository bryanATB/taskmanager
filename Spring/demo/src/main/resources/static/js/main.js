// JS para la UI de tareas usando la API de Spring Boot
// Obtiene CSRF token de meta tags (Thymeleaf lo provee) y realiza peticiones a /tasks

// Obtener el token CSRF
const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

// Configuración para las peticiones fetch
function makeHeaders() {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (csrfHeader && csrfToken) headers[csrfHeader] = csrfToken;
    return headers;
}

// Función para cargar las tareas
async function loadTasks() {
    try {
        const response = await fetch('/tasks', { headers: makeHeaders() });
        if (!response.ok) throw new Error('No se pudo cargar tareas');
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Error al cargar las tareas:', error);
    }
}

// Función para renderizar las tareas en la tabla
function renderTasks(tasks) {
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!tasks || tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay tareas aún. Crea una nueva.</td></tr>';
        return;
    }

    tasks.forEach(task => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Título">${escapeHtml(task.title)}</td>
            <td data-label="Fecha">${formatDate(task.dueDate)}</td>
            <td data-label="Estado">${escapeHtml(task.status || 'Pendiente')}</td>
            <td data-label="Acciones" class="actions">
                <a href="/view-task/${task.id}" class="btn btn-ghost">Ver</a>
                <a href="/edit-task/${task.id}" class="btn btn-ghost">Editar</a>
                <button onclick="deleteTask(${task.id})" class="btn" style="background:#ef4444">Eliminar</button>
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
            method,
            body: JSON.stringify(task)
        });

        if (response.ok) {
            window.location.href = '/dashboard';
        } else {
            // try to read error message from server
            let msg = 'Error al guardar la tarea';
            try {
                const err = await response.json();
                if (err) {
                    if (err.error) msg = err.error;
                    else if (err.message) msg = err.message;
                    else msg = JSON.stringify(err);
                }
            } catch (e) {
                // ignore parse
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
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;

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
                alert(result.error || 'Error al eliminar la tarea');
            }
        } else {
            let msg = 'Error al eliminar la tarea';
            try {
                const err = await response.json();
                if (err) msg = err.error || err.message || JSON.stringify(err);
            } catch (e) {}
            alert(msg);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la tarea');
    }
}

// Función para formatear fechas
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES');
}

// Función para escapar HTML y prevenir XSS
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Cargar tareas si estamos en el dashboard
    if (document.getElementById('tasksTableBody')) {
        loadTasks();
    }

    // Configurar formulario de tarea si existe
    const taskForm = document.querySelector('form[action="/save-task"]');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskForm);
    }
});