
(function() {
    let proyectosDisponibles = [];

    // Cargar proyectos disponibles
    async function loadProyectosDisponibles() {
        try {
            const headers = makeHeaders();
            const response = await fetch('/api/proyectos', { headers });
            
            if (!response.ok) return;
            
            proyectosDisponibles = await response.json();
        } catch (error) {
            console.error('Error cargando proyectos:', error);
        }
    }

    // Función para agregar tarea a proyecto
    async function agregarTareaAProyecto(tareaId, proyectoId) {
        try {
            const response = await fetch(`/api/proyectos/${proyectoId}/tareas/${tareaId}`, {
                method: 'POST',
                headers: makeHeaders()
            });

            if (response.ok) {
                mostrarNotificacion('Tarea agregada al proyecto correctamente', 'success');
            } else {
                const error = await response.json();
                mostrarNotificacion(error.error || 'Error al agregar la tarea al proyecto', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al agregar la tarea al proyecto', 'error');
        }
    }

    // Función para mostrar modal de selección de proyecto
    window.mostrarModalProyecto = function(tareaId, tareaTitulo) {
        if (proyectosDisponibles.length === 0) {
            mostrarNotificacion('No hay proyectos disponibles. Crea un proyecto primero.', 'info');
            return;
        }
        
        // Crear modal dinámicamente
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modalAsignarProyecto';
        
        let opcionesProyectos = proyectosDisponibles.map(p => {
            const colorDot = `<span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${p.color || '#3b82f6'}; margin-right: 8px;"></span>`;
            return `<option value="${p.id}">${colorDot}${escapeHtml(p.nombre)}</option>`;
        }).join('');
        
        modal.innerHTML = `
            <div class="modal-box">
                <div class="modal-header-custom">
                    <h3>Agregar a Proyecto</h3>
                    <button class="modal-close-btn" onclick="cerrarModalProyecto()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body-custom">
                    <p class="modal-task-title">📋 Tarea: <strong>${escapeHtml(tareaTitulo)}</strong></p>
                    <label for="selectProyectoModal">Seleccionar Proyecto:</label>
                    <select id="selectProyectoModal" class="modal-select-custom">
                        <option value="">Selecciona un proyecto...</option>
                        ${opcionesProyectos}
                    </select>
                </div>
                <div class="modal-footer-custom">
                    <button class="btn-modal btn-cancel" onclick="cerrarModalProyecto()">Cancelar</button>
                    <button class="btn-modal btn-confirm" onclick="confirmarAsignacionProyecto(${tareaId})">Agregar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Reinicializar iconos de Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Hacer visible el modal con animación
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
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
    };

    // Confirmar asignación de tarea a proyecto
    window.confirmarAsignacionProyecto = async function(tareaId) {
        const select = document.getElementById('selectProyectoModal');
        const proyectoId = select.value;
        
        if (!proyectoId) {
            mostrarNotificacion('Por favor selecciona un proyecto', 'error');
            return;
        }
        
        await agregarTareaAProyecto(tareaId, proyectoId);
        cerrarModalProyecto();
    };

    // Cerrar modal de proyecto
    window.cerrarModalProyecto = function() {
        const modal = document.getElementById('modalAsignarProyecto');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    };

    // Función auxiliar para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo) {
        // Crear notificación toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i data-lucide="${getIconForType(tipo)}"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            background-color: ${getColorForType(tipo)};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease;
            font-size: 14px;
            font-weight: 500;
            max-width: 400px;
        `;
        
        document.body.appendChild(toast);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function getIconForType(tipo) {
        const icons = {
            'success': 'check-circle',
            'error': 'alert-circle',
            'info': 'info'
        };
        return icons[tipo] || 'info';
    }

    function getColorForType(tipo) {
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'info': '#3b82f6'
        };
        return colors[tipo] || '#3b82f6';
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Inicializar al cargar la página
    document.addEventListener('DOMContentLoaded', function() {
        const tasksTableBody = document.getElementById('tasksTableBody');
        if (tasksTableBody) {
            loadProyectosDisponibles();
        }
    });

    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .toast-content i {
            width: 20px;
            height: 20px;
        }
    `;
    document.head.appendChild(style);
})();