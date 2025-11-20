// history.js - JavaScript para el historial de tareas completadas

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

// Cargar tareas completadas desde el historial
async function loadCompletedTasks() {
    try {
        const response = await fetch('/api/tasks/completed', { 
            headers: makeHeaders() 
        });
        
        if (!response.ok) {
            throw new Error('No se pudo cargar el historial');
        }
        
        const tasks = await response.json();
        renderHistoryTasks(tasks);
    } catch (error) {
        console.error('Error al cargar el historial:', error);
        const tbody = document.getElementById('historyTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: #ef4444;">Error al cargar el historial</td></tr>';
        }
    }
}

// Renderizar tareas en el historial
function renderHistoryTasks(tasks) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (!tasks || tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay tareas completadas aún.</td></tr>';
        return;
    }

    tasks.forEach(task => {
        const tr = document.createElement('tr');
        
        const prioridadBadge = getPriorityBadge(task.priority || 'MEDIA');
        const categoryName = task.category || 'Sin categoría';
        
        tr.innerHTML = `
            <td>
                <span style="font-weight: 500; color: var(--text-primary);">${escapeHtml(task.title)}</span>
            </td>
            <td>
                <span class="badge" style="background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe;">
                    ${escapeHtml(categoryName)}
                </span>
            </td>
            <td style="color: var(--text-secondary);">${formatDate(task.dueDate)}</td>
            <td>${prioridadBadge}</td>
            <td>
                <div class="action-buttons-table">
                    <a href="/view-history/${task.historialId}" class="btn-table btn-view">Ver</a>
                    <button onclick="restoreTask(${task.id})" class="btn-table btn-edit">Restaurar</button>
                    <button onclick="deleteTask(${task.id})" class="btn-table btn-delete">Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Restaurar tarea (marcar como pendiente)
async function restoreTask(id) {
    if (!confirm('¿Deseas restaurar esta tarea al dashboard? Se eliminará del historial.')) {
        return;
    }

    try {
        const response = await fetch(`/tasks/${id}/restore`, {
            headers: makeHeaders(),
            method: 'POST'
        });

        if (response.ok) {
            const result = await response.json();
            showNotification(result.message || 'Tarea restaurada correctamente', 'success');
            // Recargar el historial para que desaparezca la tarea restaurada
            loadCompletedTasks();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Error al restaurar la tarea', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al restaurar la tarea', 'error');
    }
}

// Eliminar tarea permanentemente
async function deleteTask(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar permanentemente esta tarea?')) {
        return;
    }

    try {
        const response = await fetch(`/tasks/${id}`, {
            headers: makeHeaders(),
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Tarea eliminada correctamente', 'success');
            loadCompletedTasks();
        } else {
            showNotification('Error al eliminar la tarea', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar la tarea', 'error');
    }
}

function getPriorityBadge(priority) {
    const styles = {
        'ALTA': 'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;',
        'MEDIA': 'background: #fef3c7; color: #d97706; border: 1px solid #fde68a;',
        'BAJA': 'background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe;'
    };
    
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
        const darkStyles = {
            'ALTA': 'background: #7f1d1d; color: #fca5a5; border: 1px solid #991b1b;',
            'MEDIA': 'background: #78350f; color: #fcd34d; border: 1px solid #92400e;',
            'BAJA': 'background: #312e81; color: #a5b4fc; border: 1px solid #3730a3;'
        };
        const style = darkStyles[priority] || darkStyles['MEDIA'];
        return `<span class="badge" style="${style}">${priority}</span>`;
    }
    
    const style = styles[priority] || styles['MEDIA'];
    return `<span class="badge" style="${style}">${priority}</span>`;
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

// Búsqueda en historial
function initializeHistorySearch() {
    const searchInput = document.getElementById('searchHistory');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#historyTableBody tr');
        
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

function showNotification(message, type = 'info') {
    alert(message);
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    const historyTableBody = document.getElementById('historyTableBody');
    if (historyTableBody) {
        loadCompletedTasks();
        initializeHistorySearch();
    }
});