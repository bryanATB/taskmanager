// main.js - Actualización completa con soporte para categorías

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

// Cargar solo tareas activas (no completadas)
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks/active', { 
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
            tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color: #ef4444;">Error al cargar las tareas</td></tr>';
        }
    }
}

// Cargar categorías para el selector
async function loadCategoriesSelect() {
    try {
        const response = await fetch('/api/categories', { 
            headers: makeHeaders() 
        });
        
        if (!response.ok) return;
        
        const categories = await response.json();
        const select = document.getElementById('categoryId');
        
        if (select) {
            select.innerHTML = '<option value="">Sin categoría</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nombre;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

function renderTasks(tasks) {
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (!tasks || tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay tareas activas. <a href="/create-task" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Crea una nueva</a></td></tr>';
        return;
    }

    tasks.forEach(task => {
        const tr = document.createElement('tr');
        
        const prioridadBadge = getPriorityBadge(task.priority || 'MEDIA');
        const estadoBadge = getStatusBadge(task.status || 'PENDIENTE');
        
        // Obtener información de categoría
        const categoryName = task.category ? task.category.nombre : 'Sin categoría';
        const categoryColor = task.category ? task.category.color : '#94a3b8';
        
        tr.innerHTML = `
            <td>
                <span style="font-weight: 500; color: #0f172a;">${escapeHtml(task.title)}</span>
            </td>
            <td>
                <span class="badge" style="background: ${categoryColor}20; color: ${categoryColor}; border: 1px solid ${categoryColor}40;">
                    ${escapeHtml(categoryName)}
                </span>
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

function getPriorityBadge(priority) {
    const styles = {
        'ALTA': 'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;',
        'MEDIA': 'background: #fef3c7; color: #d97706; border: 1px solid #fde68a;',
        'BAJA': 'background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe;'
    };
    
    const style = styles[priority] || styles['MEDIA'];
    return `<span class="badge" style="${style}">${priority}</span>`;
}

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

async function handleTaskForm(event) {
    event.preventDefault();
    const form = event.target;
    const isEdit = form.dataset.taskId;
    
    const task = {
        title: form.querySelector('#title').value,
        description: form.querySelector('#description').value,
        dueDate: form.querySelector('#dueDate').value,
        status: form.querySelector('#status').value,
        priority: form.querySelector('#priority')?.value,
        categoryId: form.querySelector('#categoryId')?.value || null
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
            } catch (e) {}
            showNotification(msg, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al guardar la tarea', 'error');
    }
}

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
            showNotification('Tarea eliminada correctamente', 'success');
            loadTasks();
        } else {
            showNotification('Error al eliminar la tarea', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar la tarea', 'error');
    }
}

function showNotification(message, type = 'info') {
    alert(message);
}

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

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Búsqueda mejorada por nombre y categoría
function initializeSearch() {
    const searchInput = document.querySelector('.b');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#tasksTableBody tr');
        
        rows.forEach(row => {
            const title = row.querySelector('td:first-child')?.textContent.toLowerCase() || '';
            const category = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
            
            if (title.includes(searchTerm) || category.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const tasksTableBody = document.getElementById('tasksTableBody');
    if (tasksTableBody) {
        loadTasks();
        initializeSearch();
    }

    const taskForm = document.querySelector('form#taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskForm);
        loadCategoriesSelect();
    }
});