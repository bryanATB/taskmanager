// main.js - Versión completa con onclick funcionando

const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

// Variables globales
let proyectosDisponibles = [];

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

// ========== FUNCIONES DE PROYECTOS (GLOBALES) ==========

// Cargar proyectos disponibles
window.loadProyectosDisponibles = async function() {
    try {
        const response = await fetch('/api/proyectos', { 
            headers: makeHeaders() 
        });
        
        if (!response.ok) {
            console.log('No se pudieron cargar proyectos');
            return;
        }
        
        proyectosDisponibles = await response.json();
        console.log('✅ Proyectos cargados:', proyectosDisponibles.length);
    } catch (error) {
        console.error('❌ Error cargando proyectos:', error);
    }
};

// Mostrar modal para seleccionar proyecto - FUNCIÓN GLOBAL
window.mostrarModalProyecto = function(tareaId, tareaTitulo) {
    console.log('🔷 Abriendo modal para tarea:', tareaId, tareaTitulo);
    
    if (proyectosDisponibles.length === 0) {
        alert('No hay proyectos disponibles. Crea un proyecto primero.');
        return;
    }
    
    // Remover modal existente si hay
    const modalExistente = document.getElementById('modalProyecto');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'modalProyecto';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
    `;
    
    const isDark = document.body.classList.contains('dark-mode');
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: ${isDark ? '#1e293b' : '#ffffff'};
        border-radius: 16px;
        padding: 24px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    `;
    
    // Generar opciones de proyectos
    let opcionesHTML = '<option value="">Selecciona un proyecto...</option>';
    proyectosDisponibles.forEach(p => {
        opcionesHTML += `<option value="${p.id}">${escapeHtml(p.nombre)}</option>`;
    });
    
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const secondaryColor = isDark ? '#cbd5e1' : '#64748b';
    const bgColor = isDark ? '#334155' : '#f8fafc';
    const borderColor = isDark ? '#475569' : '#e2e8f0';
    
    modalContent.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: ${textColor}; font-size: 20px; font-weight: 600;">
            Agregar a Proyecto
        </h3>
        <p style="margin-bottom: 20px; color: ${secondaryColor}; font-size: 14px;">
            Tarea: <strong style="color: ${textColor};">${escapeHtml(tareaTitulo)}</strong>
        </p>
        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: ${secondaryColor}; font-size: 12px; text-transform: uppercase;">
            Seleccionar Proyecto:
        </label>
        <select id="selectProyecto" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid ${borderColor}; margin-bottom: 20px; background-color: ${bgColor}; color: ${textColor}; font-family: 'Inter', sans-serif; font-size: 14px;">
            ${opcionesHTML}
        </select>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="btnCancelarModal" style="padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; background-color: ${bgColor}; color: ${secondaryColor}; font-weight: 500; font-family: 'Inter', sans-serif; font-size: 14px; transition: all 0.2s;">
                Cancelar
            </button>
            <button id="btnConfirmarModal" style="padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; background-color: #3b82f6; color: white; font-weight: 500; font-family: 'Inter', sans-serif; font-size: 14px; transition: all 0.2s;">
                Agregar
            </button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('btnCancelarModal').addEventListener('click', () => {
        cerrarModalProyecto();
    });
    
    document.getElementById('btnConfirmarModal').addEventListener('click', () => {
        confirmarAgregarProyecto(tareaId);
    });
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarModalProyecto();
        }
    });
    
    // Cerrar con ESC
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            cerrarModalProyecto();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
    
    console.log('✅ Modal creado y mostrado');
};

// Cerrar modal - FUNCIÓN GLOBAL
window.cerrarModalProyecto = function() {
    const modal = document.getElementById('modalProyecto');
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            modal.remove();
        }, 200);
    }
};

// Confirmar y agregar tarea al proyecto - FUNCIÓN GLOBAL
window.confirmarAgregarProyecto = async function(tareaId) {
    const select = document.getElementById('selectProyecto');
    const proyectoId = select.value;
    
    if (!proyectoId) {
        alert('Por favor selecciona un proyecto');
        return;
    }
    
    console.log('📤 Agregando tarea', tareaId, 'al proyecto', proyectoId);
    
    try {
        const response = await fetch(`/api/proyectos/${proyectoId}/tareas/${tareaId}`, {
            method: 'POST',
            headers: makeHeaders()
        });

        if (response.ok) {
            console.log('✅ Tarea agregada correctamente');
            alert('✅ Tarea agregada al proyecto correctamente');
            cerrarModalProyecto();
        } else {
            const error = await response.json();
            console.error('❌ Error del servidor:', error);
            alert('❌ ' + (error.error || 'Error al agregar la tarea al proyecto'));
        }
    } catch (error) {
        console.error('❌ Error de red:', error);
        alert('❌ Error al agregar la tarea al proyecto');
    }
};

// ========== FUNCIONES DE TAREAS ==========

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
            tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: #ef4444;">Error al cargar las tareas</td></tr>';
        }
    }
}

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
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay tareas activas. <a href="/create-task" class="link-primary">Crea una nueva</a></td></tr>';
        return;
    }

    tasks.forEach(task => {
        const tr = document.createElement('tr');
        
        const prioridadBadge = getPriorityBadge(task.priority || 'MEDIA');
        const estadoBadge = getStatusBadge(task.status || 'PENDIENTE');
        
        const categoryName = task.category ? task.category.nombre : 'Sin categoría';
        const categoryColor = task.category ? task.category.color : '#94a3b8';
        
        // IMPORTANTE: Escapar comillas simples correctamente para onclick
        const titleEscaped = escapeHtml(task.title).replace(/'/g, '&#39;');
        
        tr.innerHTML = `
            <td>
                <span class="task-title">${escapeHtml(task.title)}</span>
            </td>
            <td>
                <span class="badge category-badge" style="background: ${categoryColor}20; color: ${categoryColor}; border: 1px solid ${categoryColor}40;">
                    ${escapeHtml(categoryName)}
                </span>
            </td>
            <td class="text-muted">${formatDate(task.startDate)}</td>
            <td class="text-muted">${formatDate(task.dueDate)}</td>
            <td>${prioridadBadge}</td>
            <td>${estadoBadge}</td>
            <td>
                <div class="action-buttons-table">
                    <a href="/view-task/${task.id}" class="btn-table btn-view" title="Ver tarea">
                        <i data-lucide="eye"></i>
                    </a>
                    <a href="/edit-task/${task.id}" class="btn-table btn-edit" title="Editar tarea">
                        <i data-lucide="edit"></i>
                    </a>
                    <button onclick="mostrarModalProyecto(${task.id}, '${titleEscaped}')" class="btn-table btn-proyecto" title="Agregar a proyecto">
                        <i data-lucide="folder-plus"></i>
                    </button>
                    <button onclick="deleteTask(${task.id})" class="btn-table btn-delete" title="Eliminar tarea">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Recrear iconos de Lucide después de agregar el contenido
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    console.log('✅ Tareas renderizadas:', tasks.length);
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

function getStatusBadge(status) {
    const styles = {
        'COMPLETADA': 'background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0;',
        'EN_PROGRESO': 'background: #fef3c7; color: #d97706; border: 1px solid #fde68a;',
        'PENDIENTE': 'background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;'
    };
    
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
        const darkStyles = {
            'COMPLETADA': 'background: #14532d; color: #86efac; border: 1px solid #166534;',
            'EN_PROGRESO': 'background: #78350f; color: #fcd34d; border: 1px solid #92400e;',
            'PENDIENTE': 'background: #334155; color: #cbd5e1; border: 1px solid #475569;'
        };
        const style = darkStyles[status] || darkStyles['PENDIENTE'];
        const displayText = {
            'COMPLETADA': 'Completada',
            'EN_PROGRESO': 'En Progreso',
            'PENDIENTE': 'Pendiente'
        };
        const text = displayText[status] || status;
        return `<span class="badge" style="${style}">${text}</span>`;
    }
    
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
        startDate: form.querySelector('#startDate')?.value || null,
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

window.deleteTask = async function(id) {
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
};

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

function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
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

function setupDarkModeObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const tbody = document.getElementById('tasksTableBody');
                if (tbody && tbody.children.length > 0) {
                    loadTasks();
                }
            }
        });
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
}

async function loadAlerts() {
    try {
        const [proximasResponse, vencidasResponse] = await Promise.all([
            fetch('/api/tasks/proximas-vencer', { headers: makeHeaders() }),
            fetch('/api/tasks/vencidas', { headers: makeHeaders() })
        ]);
        
        const proximas = await proximasResponse.json();
        const vencidas = await vencidasResponse.json();
        
        renderAlerts(proximas, vencidas);
    } catch (error) {
        console.error('Error cargando alertas:', error);
    }
}

function renderAlerts(proximas, vencidas) {
    const alertsContainer = document.getElementById('alertsContainer');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    
    if (vencidas.length > 0) {
        const vencidasDiv = document.createElement('div');
        vencidasDiv.className = 'alert-box alert-danger';
        vencidasDiv.innerHTML = `
            <div class="alert-header">
                <i data-lucide="alert-triangle"></i>
                <h4>⚠️ Tareas Vencidas (${vencidas.length})</h4>
            </div>
            <ul class="alert-list">
                ${vencidas.map(t => `
                    <li>
                        <a href="/view-task/${t.id}">${escapeHtml(t.title)}</a>
                        <span class="alert-date">Venció: ${formatDate(t.dueDate)}</span>
                    </li>
                `).join('')}
            </ul>
        `;
        alertsContainer.appendChild(vencidasDiv);
    }
    
    if (proximas.length > 0) {
        const proximasDiv = document.createElement('div');
        proximasDiv.className = 'alert-box alert-warning';
        proximasDiv.innerHTML = `
            <div class="alert-header">
                <i data-lucide="clock"></i>
                <h4>🔔 Próximas a Vencer (${proximas.length})</h4>
            </div>
            <ul class="alert-list">
                ${proximas.map(t => `
                    <li>
                        <a href="/view-task/${t.id}">${escapeHtml(t.title)}</a>
                        <span class="alert-date">Vence: ${formatDate(t.dueDate)}</span>
                    </li>
                `).join('')}
            </ul>
        `;
        alertsContainer.appendChild(proximasDiv);
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Agregar animaciones CSS dinámicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Estilos para botones con solo iconos */
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
    
    .btn-edit {
        background-color: #fef3c7;
        color: #d97706;
    }
    
    .btn-edit:hover {
        background-color: #f59e0b;
        color: #ffffff;
        transform: translateY(-2px);
    }
    
    .btn-proyecto {
        background-color: #e0e7ff;
        color: #4338ca;
    }
    
    .btn-proyecto:hover {
        background-color: #6366f1;
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
    
    .dark-mode .btn-edit {
        background-color: #78350f;
        color: #fcd34d;
    }
    
    .dark-mode .btn-proyecto {
        background-color: #312e81;
        color: #a5b4fc;
    }
    
    .dark-mode .btn-delete {
        background-color: #7f1d1d;
        color: #fca5a5;
    }
`;
document.head.appendChild(style);

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación...');
    
    const tasksTableBody = document.getElementById('tasksTableBody');
    if (tasksTableBody) {
        console.log('📋 Dashboard detectado');
        loadProyectosDisponibles();
        loadTasks();
        loadAlerts();
        initializeSearch();
        setupDarkModeObserver();
    }

    const taskForm = document.querySelector('form#taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskForm);
        loadCategoriesSelect();
    }
    
    console.log('✅ Aplicación inicializada');
});