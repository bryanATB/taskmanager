// categories.js - JavaScript para la gestión de categorías

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

// Cargar categorías
async function loadCategories() {
    try {
        const response = await fetch('/api/categories', { 
            headers: makeHeaders() 
        });
        
        if (!response.ok) {
            throw new Error('No se pudo cargar categorías');
        }
        
        const categories = await response.json();
        renderCategories(categories);
    } catch (error) {
        console.error('Error al cargar las categorías:', error);
        const grid = document.getElementById('categoriesGrid');
        if (grid) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #ef4444; padding: 40px;">Error al cargar las categorías</div>';
        }
    }
}

// Renderizar categorías
function renderCategories(categories) {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;

    grid.innerHTML = '';
    
    if (!categories || categories.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">No hay categorías aún. <a href="/create-category" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Crea una nueva</a></div>';
        return;
    }

    categories.forEach(category => {
        const card = document.createElement('div');
        card.style.cssText = `
            background-color: #ffffff;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
            border: 1px solid #f1f5f9;
            border-left: 4px solid ${category.color};
            transition: all 0.2s ease;
        `;
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #0f172a;">
                        ${escapeHtml(category.nombre)}
                    </h4>
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                        ${escapeHtml(category.descripcion || 'Sin descripción')}
                    </p>
                </div>
                <div style="width: 32px; height: 32px; background-color: ${category.color}; border-radius: 8px; flex-shrink: 0;"></div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                <button onclick="deleteCategory(${category.id})" class="btn-table btn-delete" style="flex: 1;">
                    Eliminar
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Eliminar categoría
async function deleteCategory(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
        return;
    }

    try {
        const response = await fetch(`/api/categories/${id}`, {
            headers: makeHeaders(),
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Categoría eliminada correctamente', 'success');
            loadCategories();
        } else {
            showNotification('Error al eliminar la categoría', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar la categoría', 'error');
    }
}

// Manejar formulario de categoría
async function handleCategoryForm(event) {
    event.preventDefault();
    const form = event.target;
    
    const category = {
        nombre: form.querySelector('#nombre').value,
        descripcion: form.querySelector('#descripcion').value,
        color: form.querySelector('#color').value
    };

    try {
        const response = await fetch('/api/categories', {
            headers: makeHeaders(),
            method: 'POST',
            body: JSON.stringify(category)
        });

        if (response.ok) {
            window.location.href = '/categories';
        } else {
            const err = await response.json();
            showNotification(err.error || 'Error al guardar la categoría', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al guardar la categoría', 'error');
    }
}

function showNotification(message, type = 'info') {
    alert(message);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (categoriesGrid) {
        loadCategories();
    }

    const categoryForm = document.querySelector('form#categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategoryForm);
        
        // Actualizar el valor del color en tiempo real
        const colorInput = document.getElementById('color');
        const colorValue = document.getElementById('colorValue');
        if (colorInput && colorValue) {
            colorInput.addEventListener('input', (e) => {
                colorValue.textContent = e.target.value;
            });
        }
    }
});