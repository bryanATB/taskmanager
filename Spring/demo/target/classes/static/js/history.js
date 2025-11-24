// history.js - Gestión de tareas completadas (Historial)

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

// Cargar tareas completadas
async function loadCompletedTasks() {
    try {
        const response = await fetch('/api/tasks/completed', { 
            headers: makeHeaders() 
        });
        
        if (!response.ok) {
            throw new Error('No se pudo cargar el historial');
        }
        
        const tasks = await response.json();
        renderCompletedTasks(tasks);
    } catch (error) {
        console.error('Error al cargar historial:', error);
        const tbody = document.getElementById('historyTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: #ef4444;">Error al cargar el historial</td></tr>';
        }
    }
}

// Renderizar tareas completadas
function renderCompletedTasks(tasks) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (!tasks || tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay tareas completadas aún.</td></tr>';
        return;
    }

    tasks.forEach(task => {
        const tr = document.createElement('tr');
        
        const prioridadBadge = getPriorityBadge(task.priority || 'MEDIA');
        const categoryName = task.category || 'Sin categoría';
        
        // Badge de completada (siempre verde)
        const completadaBadge = `<span class="badge" style="background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0;">Completada</span>`;
        
        tr.innerHTML = `
            <td>
                <span class="task-title">${escapeHtml(task.title)}</span>
            </td>
            <td>
                <span class="badge category-badge" style="background: #e2e8f0; color: #475569; border: 1px solid #cbd5e1;">
                    ${escapeHtml(categoryName)}
                </span>
            </td>
            <td class="text-muted">${formatDate(task.startDate)}</td>
            <td class="text-muted">${formatDate(task.dueDate)}</td>
            <td>${prioridadBadge}</td>
            <td>${completadaBadge}</td>
            <td>
                <div class="action-buttons-table">
                    <a href="/view-history/${task.historialId}" class="btn-table btn-view" title="Ver detalles">
                        <i data-lucide="eye"></i>
                    </a>
                    <button onclick="restoreTask(${task.id})" class="btn-table btn-restore" title="Restaurar tarea">
                        <i data-lucide="rotate-ccw"></i>
                    </button>
                    <button onclick="deleteTaskPermanently(${task.id})" class="btn-table btn-delete" title="Eliminar permanentemente">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Recrear iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    console.log('✅ Historial renderizado:', tasks.length, 'tareas');
}

// Restaurar tarea al dashboard
window.restoreTask = async function(id) {
    if (!confirm('¿Restaurar esta tarea al dashboard como pendiente?')) {
        return;
    }

    try {
        const response = await fetch(`/tasks/${id}/restore`, {
            method: 'POST',
            headers: makeHeaders()
        });

        if (response.ok) {
            showNotification('✅ Tarea restaurada al dashboard', 'success');
            loadCompletedTasks();
        } else {
            const error = await response.json();
            showNotification('Error: ' + (error.error || 'No se pudo restaurar'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al restaurar la tarea', 'error');
    }
};

// Eliminar tarea permanentemente
window.deleteTaskPermanently = async function(id) {
    if (!confirm('⚠️ ¿Eliminar permanentemente esta tarea? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/tasks/${id}`, {
            method: 'DELETE',
            headers: makeHeaders()
        });

        if (response.ok) {
            showNotification('Tarea eliminada permanentemente', 'success');
            loadCompletedTasks();
        } else {
            showNotification('Error al eliminar la tarea', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar la tarea', 'error');
    }
};

// Obtener badge de prioridad (modo oscuro compatible)
function getPriorityBadge(priority) {
    const isDark = document.body.classList.contains('dark-mode');
    
    const lightStyles = {
        'ALTA': 'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;',
        'MEDIA': 'background: #fef3c7; color: #d97706; border: 1px solid #fde68a;',
        'BAJA': 'background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe;'
    };
    
    const darkStyles = {
        'ALTA': 'background: #7f1d1d; color: #fca5a5; border: 1px solid #991b1b;',
        'MEDIA': 'background: #78350f; color: #fcd34d; border: 1px solid #92400e;',
        'BAJA': 'background: #312e81; color: #a5b4fc; border: 1px solid #3730a3;'
    };
    
    const styles = isDark ? darkStyles : lightStyles;
    const style = styles[priority] || styles['MEDIA'];
    
    return `<span class="badge" style="${style}">${priority}</span>`;
}

// Formatear fecha
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

// Escapar HTML
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;

    const colors = {
        success: { bg: '#10b981', text: '#ffffff' },
        error: { bg: '#ef4444', text: '#ffffff' },
        info: { bg: '#3b82f6', text: '#ffffff' },
        warning: { bg: '#f59e0b', text: '#ffffff' }
    };

    const color = colors[type] || colors.info;
    toast.style.backgroundColor = color.bg;
    toast.style.color = color.text;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Configurar búsqueda en historial
function initializeHistorySearch() {
    const searchInput = document.querySelector('.search-input');
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

// Observer para cambios de tema
function setupDarkModeObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const tbody = document.getElementById('historyTableBody');
                if (tbody && tbody.children.length > 0) {
                    loadCompletedTasks();
                }
            }
        });
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
}

// Estilos CSS para los botones del historial
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    /* Botones del historial */
    .action-buttons-table {
        display: flex;
        gap: 8px;
        justify-content: center;
        align-items: center;
    }
    
    .btn-table {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
    }
    
    .btn-table i {
        width: 16px;
        height: 16px;
    }
    
    .btn-view {
        background-color: #dbeafe;
        color: #1e40af;
    }
    
    .btn-view:hover {
        background-color: #3b82f6;
        color: #ffffff;
        transform: translateY(-2px);
    }
    
    .btn-restore {
        background-color: #d1fae5;
        color: #059669;
    }
    
    .btn-restore:hover {
        background-color: #10b981;
        color: #ffffff;
        transform: translateY(-2px);
    }
    
    .btn-delete {
        background-color: #fee2e2;
        color: #dc2626;
    }
    
    .btn-delete:hover {
        background-color: #ef4444;
        color: #ffffff;
        transform: translateY(-2px);
    }
    
    /* Modo oscuro */
    .dark-mode .btn-view {
        background-color: #1e3a8a;
        color: #93c5fd;
    }
    
    .dark-mode .btn-restore {
        background-color: #064e3b;
        color: #6ee7b7;
    }
    
    .dark-mode .btn-delete {
        background-color: #7f1d1d;
        color: #fca5a5;
    }
    
    .task-title {
        font-weight: 500;
        color: var(--text-primary);
    }
    
    .text-muted {
        color: var(--text-secondary);
        font-size: 14px;
    }
    
    .badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        display: inline-block;
    }
    
    .category-badge {
        font-weight: 500;
    }
`;
document.head.appendChild(style);

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando página de historial...');
    
    const historyTableBody = document.getElementById('historyTableBody');
    if (historyTableBody) {
        console.log('📜 Tabla de historial detectada');
        loadCompletedTasks();
        initializeHistorySearch();
        setupDarkModeObserver();
    }
    
    console.log('✅ Historial inicializado');
});