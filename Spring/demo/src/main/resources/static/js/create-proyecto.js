// Obtener CSRF token
const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

// Elementos del formulario
const form = document.getElementById('formCrearProyecto');
const colorInput = document.getElementById('color');
const colorPreview = document.getElementById('colorPreview');
const colorValue = document.getElementById('colorValue');
const colorPresets = document.querySelectorAll('.color-preset');

// Elementos de vista previa
const previewNombre = document.getElementById('previewNombre');
const previewDescripcion = document.getElementById('previewDescripcion');
const previewColor = document.getElementById('previewColor');
const previewFechaInicio = document.getElementById('previewFechaInicio');
const previewFechaFin = document.getElementById('previewFechaFin');

// Elementos del formulario
const nombreInput = document.getElementById('nombre');
const descripcionInput = document.getElementById('descripcion');
const fechaInicioInput = document.getElementById('fechaInicio');
const fechaFinInput = document.getElementById('fechaFin');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Actualizar vista previa del color
function actualizarColor(color) {
    colorPreview.style.backgroundColor = color;
    colorValue.textContent = color;
    previewColor.style.backgroundColor = color;
    colorInput.value = color;
    
    // Actualizar preset activo
    colorPresets.forEach(preset => {
        if (preset.dataset.color === color) {
            preset.classList.add('active');
        } else {
            preset.classList.remove('active');
        }
    });
}

// Evento del color picker
colorInput.addEventListener('input', (e) => {
    actualizarColor(e.target.value);
});

// Eventos de los presets de color
colorPresets.forEach(preset => {
    preset.addEventListener('click', () => {
        const color = preset.dataset.color;
        actualizarColor(color);
    });
});

// Actualizar vista previa del nombre
nombreInput.addEventListener('input', (e) => {
    const valor = e.target.value.trim();
    previewNombre.textContent = valor || 'Nombre del Proyecto';
});

// Actualizar vista previa de la descripción
descripcionInput.addEventListener('input', (e) => {
    const valor = e.target.value.trim();
    previewDescripcion.textContent = valor || 'La descripción aparecerá aquí...';
});

// Actualizar vista previa de fecha inicio
fechaInicioInput.addEventListener('change', (e) => {
    const fecha = e.target.value;
    if (fecha) {
        const fechaFormateada = formatearFecha(fecha);
        previewFechaInicio.innerHTML = `<i data-lucide="calendar"></i> ${fechaFormateada}`;
        lucide.createIcons();
    } else {
        previewFechaInicio.innerHTML = '<i data-lucide="calendar"></i> Sin fecha de inicio';
        lucide.createIcons();
    }
});

// Actualizar vista previa de fecha fin
fechaFinInput.addEventListener('change', (e) => {
    const fecha = e.target.value;
    if (fecha) {
        const fechaFormateada = formatearFecha(fecha);
        previewFechaFin.innerHTML = `<i data-lucide="calendar-check"></i> ${fechaFormateada}`;
        lucide.createIcons();
    } else {
        previewFechaFin.innerHTML = '<i data-lucide="calendar-check"></i> Sin fecha de fin';
        lucide.createIcons();
    }
});

// Formatear fecha
function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Mostrar toast
function mostrarToast(mensaje, tipo = 'success') {
    toastMessage.textContent = mensaje;
    toast.classList.remove('error');
    
    if (tipo === 'error') {
        toast.classList.add('error');
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Enviar formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        nombre: nombreInput.value.trim(),
        descripcion: descripcionInput.value.trim(),
        color: colorInput.value,
        fechaInicio: fechaInicioInput.value || null,
        fechaFin: fechaFinInput.value || null
    };
    
    // Validar nombre
    if (!formData.nombre) {
        mostrarToast('El nombre del proyecto es obligatorio', 'error');
        nombreInput.focus();
        return;
    }
    
    // Validar fechas
    if (formData.fechaInicio && formData.fechaFin) {
        if (new Date(formData.fechaInicio) > new Date(formData.fechaFin)) {
            mostrarToast('La fecha de inicio no puede ser posterior a la fecha de fin', 'error');
            fechaInicioInput.focus();
            return;
        }
    }
    
    try {
        const btnSubmit = form.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i data-lucide="loader"></i> Creando...';
        lucide.createIcons();
        
        const response = await fetch('/api/proyectos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [csrfHeader]: csrfToken
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarToast('Proyecto creado exitosamente', 'success');
            
            // Redirigir después de 1 segundo
            setTimeout(() => {
                window.location.href = '/proyectos';
            }, 1000);
        } else {
            throw new Error(data.error || 'Error al crear el proyecto');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast(error.message || 'Error al crear el proyecto', 'error');
        
        const btnSubmit = form.querySelector('button[type="submit"]');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i data-lucide="check"></i> Crear Proyecto';
        lucide.createIcons();
    }
});

// Inicializar color preview
actualizarColor(colorInput.value);