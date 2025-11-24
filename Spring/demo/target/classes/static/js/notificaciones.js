// notificaciones.js - JavaScript para gestión de notificaciones

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

// Cargar notificaciones
async function loadNotificaciones() {
    try {
        const response = await fetch('/api/notificaciones', { 
            headers: makeHeaders() 
        });
        
        if (!response.ok) {
            throw new Error('No se pudieron cargar las notificaciones');
        }
        
        const notificaciones = await response.json();
        console.log('📬 Notificaciones cargadas:', notificaciones);
        renderNotificaciones(notificaciones);
    } catch (error) {
        console.error('❌ Error al cargar notificaciones:', error);
        const container = document.getElementById('notificacionesContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="alert-circle"></i>
                    <h3>Error al cargar</h3>
                    <p style="color: #ef4444;">No se pudieron cargar las notificaciones. Intenta de nuevo.</p>
                </div>
            `;
            lucide.createIcons();
        }
    }
}

// Renderizar notificaciones
function renderNotificaciones(notificaciones) {
    const container = document.getElementById('notificacionesContainer');
    if (!container) return;

    container.innerHTML = '';
    
    if (!notificaciones || notificaciones.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="bell-off"></i>
                <h3>No hay notificaciones</h3>
                <p>Cuando tengas alertas o actualizaciones, aparecerán aquí</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    // Ordenar notificaciones: no leídas primero, luego por fecha
    const notificacionesOrdenadas = [...notificaciones].sort((a, b) => {
        if (a.leida === b.leida) {
            return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
        }
        return a.leida ? 1 : -1;
    });

    notificacionesOrdenadas.forEach(notif => {
        const card = createNotificacionCard(notif);
        container.appendChild(card);
    });
    
    lucide.createIcons();
}

// Crear tarjeta de notificación
function createNotificacionCard(notif) {
    const card = document.createElement('div');
    card.className = `notificacion-card ${!notif.leida ? 'no-leida' : ''}`;
    card.dataset.id = notif.id;
    
    const iconType = getIconType(notif.tipo);
    const iconName = getIconName(notif.tipo);
    
    card.innerHTML = `
        <div class="notificacion-icon ${iconType}">
            <i data-lucide="${iconName}"></i>
        </div>
        <div class="notificacion-content">
            <div class="notificacion-header">
                <span class="notificacion-tipo">${formatTipo(notif.tipo)}</span>
                <span class="notificacion-fecha">${formatFecha(notif.fechaCreacion)}</span>
            </div>
            <p class="notificacion-mensaje">${escapeHtml(notif.mensaje)}</p>
            <div class="notificacion-actions">
                ${notif.tareaId ? `<button class="btn-small btn-ver" onclick="verTarea(${notif.tareaId})">
                    <i data-lucide="eye"></i>
                    Ver tarea
                </button>` : ''}
                ${!notif.leida ? `<button class="btn-small btn-marcar" onclick="marcarComoLeida(${notif.id})">
                    <i data-lucide="check"></i>
                    Marcar como leída
                </button>` : ''}
                <button class="btn-small btn-eliminar" onclick="eliminarNotificacion(${notif.id})">
                    <i data-lucide="trash-2"></i>
                    Eliminar
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Obtener tipo de icono
function getIconType(tipo) {
    if (tipo.includes('VENCIDA')) return 'danger';
    if (tipo.includes('PROXIMA')) return 'warning';
    if (tipo.includes('COMPLETADA')) return 'success';
    return 'info';
}

// Obtener nombre de icono
function getIconName(tipo) {
    if (tipo.includes('VENCIDA')) return 'alert-circle';
    if (tipo.includes('PROXIMA')) return 'clock';
    if (tipo.includes('COMPLETADA')) return 'check-circle';
    if (tipo.includes('PROYECTO')) return 'folder';
    if (tipo.includes('RECORDATORIO')) return 'bell-ring';
    return 'bell';
}

// Formatear tipo de notificación
function formatTipo(tipo) {
    const tipos = {
        'TAREA_PROXIMA': 'Próxima a vencer',
        'TAREA_VENCIDA': 'Tarea vencida',
        'TAREA_COMPLETADA': 'Tarea completada',
        'PROYECTO_ACTUALIZADO': 'Proyecto actualizado',
        'RECORDATORIO': 'Recordatorio'
    };
    return tipos[tipo] || tipo.replace(/_/g, ' ');
}

// Formatear fecha
function formatFecha(fechaStr) {
    try {
        const fecha = new Date(fechaStr);
        const ahora = new Date();
        const diff = ahora - fecha;
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);
        
        if (minutos < 1) return 'Hace un momento';
        if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
        if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
        if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
        
        return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return fechaStr;
    }
}

// Ver tarea
function verTarea(tareaId) {
    window.location.href = `/view-task/${tareaId}`;
}

// Marcar como leída
async function marcarComoLeida(id) {
    try {
        const response = await fetch(`/api/notificaciones/${id}/marcar-leida`, {
            method: 'POST',
            headers: makeHeaders()
        });

        if (response.ok) {
            console.log('✅ Notificación marcada como leída');
            showNotification('Notificación marcada como leída', 'success');
            loadNotificaciones();
        } else {
            showNotification('Error al marcar la notificación', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al marcar la notificación', 'error');
    }
}

// Eliminar notificación
async function eliminarNotificacion(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
        return;
    }

    try {
        const response = await fetch(`/api/notificaciones/${id}`, {
            method: 'DELETE',
            headers: makeHeaders()
        });

        if (response.ok) {
            console.log('✅ Notificación eliminada');
            showNotification('Notificación eliminada correctamente', 'success');
            loadNotificaciones();
        } else {
            showNotification('Error al eliminar la notificación', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar la notificación', 'error');
    }
}

// Marcar todas como leídas
async function marcarTodasComoLeidas() {
    try {
        const response = await fetch('/api/notificaciones/marcar-todas-leidas', {
            method: 'POST',
            headers: makeHeaders()
        });

        if (response.ok) {
            console.log('✅ Todas las notificaciones marcadas');
            showNotification('Todas las notificaciones marcadas como leídas', 'success');
            loadNotificaciones();
        } else {
            showNotification('Error al marcar las notificaciones', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al marcar las notificaciones', 'error');
    }
}

// Limpiar notificaciones leídas
async function limpiarLeidas() {
    if (!confirm('¿Estás seguro de que quieres eliminar todas las notificaciones leídas?')) {
        return;
    }

    try {
        const response = await fetch('/api/notificaciones/limpiar-leidas', {
            method: 'DELETE',
            headers: makeHeaders()
        });

        if (response.ok) {
            console.log('✅ Notificaciones leídas eliminadas');
            showNotification('Notificaciones leídas eliminadas', 'success');
            loadNotificaciones();
        } else {
            showNotification('Error al limpiar las notificaciones', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al limpiar las notificaciones', 'error');
    }
}

// Generar notificaciones
async function generarNotificaciones() {
    // Mostrar loading
    const container = document.getElementById('notificacionesContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading-state">
                <i data-lucide="loader"></i>
                <p>Generando notificaciones...</p>
            </div>
        `;
        lucide.createIcons();
    }

    try {
        const response = await fetch('/api/notificaciones/generar', {
            method: 'POST',
            headers: makeHeaders()
        });

        if (response.ok) {
            console.log('✅ Notificaciones generadas');
            showNotification('Notificaciones generadas correctamente', 'success');
            // Esperar un momento antes de recargar para que el usuario vea el mensaje
            setTimeout(() => {
                loadNotificaciones();
            }, 500);
        } else {
            showNotification('Error al generar notificaciones', 'error');
            loadNotificaciones(); // Recargar de todas formas
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al generar notificaciones', 'error');
        loadNotificaciones(); // Recargar de todas formas
    }
}

// Mostrar notificación temporal (Toast)
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
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

    // Colores según el tipo
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

    // Eliminar después de 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Agregar animaciones CSS
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
`;
document.head.appendChild(style);

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de notificaciones...');
    
    loadNotificaciones();
    
    // Botones de acción
    const btnMarcarTodas = document.getElementById('btnMarcarTodasLeidas');
    if (btnMarcarTodas) {
        btnMarcarTodas.addEventListener('click', marcarTodasComoLeidas);
        console.log('✅ Botón marcar todas configurado');
    }
    
    const btnLimpiar = document.getElementById('btnLimpiarLeidas');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarLeidas);
        console.log('✅ Botón limpiar configurado');
    }
    
    const btnGenerar = document.getElementById('btnGenerarNotificaciones');
    if (btnGenerar) {
        btnGenerar.addEventListener('click', generarNotificaciones);
        console.log('✅ Botón generar configurado');
    }
    
    // Recargar cada 60 segundos
    setInterval(() => {
        console.log('🔄 Recargando notificaciones automáticamente...');
        loadNotificaciones();
    }, 60000);
    
    console.log('✅ Sistema de notificaciones inicializado');
});