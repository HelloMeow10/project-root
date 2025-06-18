/**
 * Dashboard UI Controller
 * Handles all visual interactions, animations, and UI state management
 * Data loading should be handled separately via API calls
 */

class DashboardUI {
    constructor() {
        this.currentPage = 'dashboard';
        this.isMobile = window.innerWidth <= 768;
        this.chart = null;
        this.sortDirection = {};
        this.currentPage = 1;
        this.itemsPerPage = 10;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeChart();
        this.setupResponsiveHandlers();
        this.initializeAnimations();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleGlobalSearch(e.target.value));
        }

        const tableSearch = document.getElementById('tableSearch');
        if (tableSearch) {
            tableSearch.addEventListener('input', (e) => this.handleTableSearch(e.target.value));
        }

        // Modal controls
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        // Chart period selector
        const chartPeriod = document.getElementById('chart-period');
        if (chartPeriod) {
            chartPeriod.addEventListener('change', (e) => this.updateChartPeriod(e.target.value));
        }

        // Table sorting
        document.querySelectorAll('[data-sort]').forEach(header => {
            header.addEventListener('click', (e) => this.handleSort(e.target.dataset.sort));
        });

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e.target.value));
        }

        // Pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        if (prevPage) prevPage.addEventListener('click', () => this.previousPage());
        if (nextPage) nextPage.addEventListener('click', () => this.nextPage());

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }

        // Refresh activity
        const refreshActivity = document.getElementById('refreshActivity');
        if (refreshActivity) {
            refreshActivity.addEventListener('click', () => this.refreshActivity());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Window resize
        window.addEventListener('resize', () => this.handleResize());

            // Close Manage Components Modal
            const cerrarModalGestionarComponentesBtn = document.getElementById('cerrarModalGestionarComponentes');
            if (cerrarModalGestionarComponentesBtn) {
                cerrarModalGestionarComponentesBtn.onclick = () => {
                    document.getElementById('modalGestionarComponentes').style.display = 'none';
                };
            }
            const btnCerrarGestionComponentes = document.getElementById('btnCerrarGestionComponentes');
            if (btnCerrarGestionComponentes) {
                btnCerrarGestionComponentes.onclick = () => {
                    document.getElementById('modalGestionarComponentes').style.display = 'none';
                };
            }

            // Search input for Manage Package Components Modal
            const buscarProductoIndividualInput = document.getElementById('buscarProductoIndividual');
            if (buscarProductoIndividualInput) {
                buscarProductoIndividualInput.addEventListener('input', (e) => this.handleProductSearch(e));
            }

            // Event delegation for adding components in Manage Package Components Modal
            const listaDisponiblesDiv = document.getElementById('listaProductosIndividualesDisponibles');
            if (listaDisponiblesDiv) {
                listaDisponiblesDiv.addEventListener('click', handleAddComponent);
            }

            // Event delegation for removing components in Manage Package Components Modal
            const listaActualesDiv = document.getElementById('listaComponentesActuales');
            if (listaActualesDiv) {
                listaActualesDiv.addEventListener('click', handleRemoveComponent);
            }

        // Alternar pestañas de usuarios
        const tabUsuariosInternos = document.getElementById('tabUsuariosInternos');
        const tabClientes = document.getElementById('tabClientes');
        const usuariosInternosTable = document.getElementById('usuariosInternosTable');
        const clientesTable = document.getElementById('clientesTable');

        if (tabUsuariosInternos && tabClientes && usuariosInternosTable && clientesTable) {
          tabUsuariosInternos.onclick = async () => {
            tabUsuariosInternos.classList.add('active');
            tabClientes.classList.remove('active');
            usuariosInternosTable.style.display = '';
            clientesTable.style.display = 'none';
            // Usa el método de tu clase para renderizar
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users/internos', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            this.renderUsuariosInternosTable(data);
          };
          tabClientes.onclick = async () => {
            tabClientes.classList.add('active');
            tabUsuariosInternos.classList.remove('active');
            usuariosInternosTable.style.display = 'none';
            clientesTable.style.display = '';
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users/clientes', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            this.renderClientesTable(data);
          };
          // Mostrar por defecto usuarios internos
          tabUsuariosInternos.click();
        }

        document.getElementById('formAgregarPaquete').onsubmit = async function(e) {
          e.preventDefault();
          const nombre = document.getElementById('nombrePaquete').value;
          const precio = document.getElementById('precioPaquete').value;
          const token = localStorage.getItem('token');
          const res = await fetch('/api/products/paquetes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre, precio })
          });
          if (res.ok) {
            DashboardAPI.showNotification('Paquete añadido', 'success');
            cargarPaquetes();
            this.reset();
          } else {
            DashboardAPI.showNotification('Error al añadir paquete', 'error');
          }
        };

        // Cerrar modal
        document.getElementById('cerrarModalEditar').onclick = function() {
          document.getElementById('modalEditarUsuario').style.display = 'none';
        };
        document.getElementById('cancelarEditarUsuario').onclick = function() {
          document.getElementById('modalEditarUsuario').style.display = 'none';
        };

        // Guardar cambios
        document.getElementById('formEditarUsuario').onsubmit = async function(e) {
          e.preventDefault();
          const id = document.getElementById('editIdUsuario').value;
          const data = {
            nombre: document.getElementById('editNombre').value,
            apellido: document.getElementById('editApellido').value,
            email: document.getElementById('editEmail').value,
            telefono: document.getElementById('editTelefono').value,
            id_rol: document.getElementById('editRol').value
          };
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/users/internos/${id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          if (res.ok) {
            dashboardUI.showNotification('Usuario actualizado', 'success');
            document.getElementById('modalEditarUsuario').style.display = 'none';
            // Recarga la tabla de usuarios internos
            const tabUsuariosInternos = document.getElementById('tabUsuariosInternos');
            if (tabUsuariosInternos) tabUsuariosInternas.click();
          } else {
            dashboardUI.showNotification('Error al actualizar usuario', 'error');
          }
        };

        

        // Cerrar modal
        document.getElementById('cerrarModalProducto').onclick = cerrarModalProducto;
        document.getElementById('cancelarProducto').onclick = cerrarModalProducto;
        function cerrarModalProducto() {
          document.getElementById('modalProducto').style.display = 'none';
        }

        // Abrir modal para editar producto
        async function abrirModalEditarProducto(id) {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/products/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const producto = await res.json();
          document.getElementById('modalProductoTitulo').textContent = 'Editar Producto';
          document.getElementById('productoId').value = producto.id || producto.id_producto;
          document.getElementById('productoNombre').value = producto.nombre;
          document.getElementById('productoTipo').value = producto.tipo;
          document.getElementById('productoPrecio').value = producto.precio;
          document.getElementById('modalProducto').style.display = 'block';
        }

        // Guardar producto (crear o editar)
        document.getElementById('formProducto').onsubmit = async function(e) {
          e.preventDefault();
          const id = document.getElementById('productoId').value;
          const formData = {
            nombre: document.getElementById('productoNombre').value,
            descripcion: document.getElementById('productoDescripcion').value,
            tipo: document.getElementById('productoTipo').value, // This is the string e.g., "auto"
            precio: Number(document.getElementById('productoPrecio').value),
            stock: Number(document.getElementById('productoStock').value),
            activo: document.getElementById('productoActivo').checked
          };
          const token = localStorage.getItem('token');

          let method = 'POST';
          let url = `/api/products?_=${Date.now()}`;
          if (id) {
            method = 'PUT';
            url = `/api/products/${id}?_=${Date.now()}`;
          }
          
          console.log(`Enviando producto (${method}):`, formData, 'to URL:', url);

          try {
            const res = await fetch(url, {
              method: method,
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(formData)
            });

            console.log('Respuesta del servidor:', res.status); 
            if (res.ok) {
              DashboardAPI.showNotification(`Producto ${id ? 'actualizado' : 'creado'} con éxito`, 'success');
              cerrarModalProducto();
              cargarProductos(); // Make sure this function is correctly defined and accessible
            } else {
              const errorData = await res.json().catch(() => ({ message: 'Error desconocido al procesar la respuesta.' }));
              DashboardAPI.showNotification(`Error al ${id ? 'actualizar' : 'crear'} producto: ${errorData.message || res.statusText}`, 'error');
              console.error('Error guardando producto:', res.status, res.statusText, errorData);
            }
          } catch (err) {
            console.error('Error de red o fetch al guardar producto:', err);
            DashboardAPI.showNotification('Error de red al intentar guardar el producto.', 'error');
          }
        };
    }

    // Navigation Methods
    handleNavigation(e) {
        e.preventDefault();
        
        const link = e.target.closest('.nav-link');
        const page = link.dataset.page;
        
        // Update active states
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Show page
        this.showPage(page);
        
        // Close mobile sidebar
        if (this.isMobile) {
            this.closeSidebar();
        }
    }

    showPage(pageId) {
        console.log('Mostrando página:', pageId); // <-- agrega esto
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
            
            // Trigger page-specific initialization
            this.onPageShow(pageId);
        }
    }

    onPageShow(pageId) {
        console.log(`[onPageShow] Started. pageId: '${pageId}' (type: ${typeof pageId})`); // Log entry and type
        
        if (pageId === 'productos') {
            console.log("[onPageShow] Condition for 'productos' met. Calling cargarProductos().");
            cargarProductos();
        } else if (pageId === 'paquetes') {
            console.log("[onPageShow] Condition for 'paquetes' met. Calling cargarPaquetes()."); // Key log
            cargarPaquetes();
        } else {
            console.log(`[onPageShow] pageId '${pageId}' did not match 'productos' or 'paquetes'.`);
        }
        
        console.log(`[onPageShow] Dispatching pageChanged event for pageId: '${pageId}'.`);
        document.dispatchEvent(new CustomEvent('pageChanged', { 
            detail: { page: pageId } 
        }));
        console.log("[onPageShow] Finished.");
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('show');
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('show');
    }

    // Search Methods
    handleGlobalSearch(query = '') {
        // Emit search event for external handling
        document.dispatchEvent(new CustomEvent('globalSearch', { 
            detail: { query, page: this.currentPage } 
        }));
    }

    handleTableSearch(query) {
        // Emit table search event
        document.dispatchEvent(new CustomEvent('tableSearch', { 
            detail: { query } 
        }));
    }

    // Modal Methods
    showModal(title, content, footer = '') {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');
        
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modalFooter.innerHTML = footer;
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus management
        const firstInput = modal.querySelector('input, select, textarea, button');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    closeModal() {
        const modal = document.getElementById('modal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
   }

    // Chart Methods
    initializeChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        this.chart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Ventas por Mes',
                    data: [],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#3498db',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#3498db',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    x: {
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    renderUsuariosInternosTable(data) {
        const tbody = document.getElementById('usuariosInternosTableBody');
        tbody.innerHTML = '';
        data.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.id_usuario}</td>
                <td>${u.nombre}</td>
                <td>${u.apellido || ''}</td>
                <td>${u.email}</td>
                <td>${u.telefono || ''}</td>
                <td>${u.activo ? 'Sí' : 'No'}</td>
                <td>${u.id_rol || ''}</td>
                <td>
                    <button class="btn-activar" data-id="${u.id_usuario}" data-activo="${u.activo}">
                        ${u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="btn-eliminar" data-id="${u.id_usuario}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Listeners para los botones
        tbody.querySelectorAll('.btn-activar').forEach(btn => {
            btn.onclick = (e) => {
                const id = btn.getAttribute('data-id');
                const activo = btn.getAttribute('data-activo') === 'true';
                this.toggleUsuarioInternoActivo(id, !activo);
            };
        });
        tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.onclick = (e) => {
                const id = btn.getAttribute('data-id');
                this.eliminarUsuarioInterno(id);
            };
        });
    }

    renderClientesTable(data) {
        const tbody = document.getElementById('clientesTableBody');
        tbody.innerHTML = '';
        data.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${u.id}</td>
              <td>${u.nombre}</td>
              <td>${u.apellido || ''}</td>
              <td>${u.email}</td>
              <td>${u.telefono || ''}</td>
              <td>${u.activo ? 'Sí' : 'No'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    setupResponsiveHandlers() {
        // Handle responsive behavior
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        mediaQuery.addListener((e) => {
            this.isMobile = e.matches;
            if (!this.isMobile) {
                this.closeSidebar();
            }
        });
    }

    initializeAnimations() {
        // Add CSS for fade-in animation
        const style = document.createElement('style');
        style.textContent = `
            .fade-in {
                opacity: 0;
                animation: fadeInUp 0.3s ease forwards;
            }
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }
        // Escape to close modal
        if (e.key === 'Escape') {
            this.closeModal();
        }
    }

    // Métodos utilitarios requeridos por DashboardAPI y funciones globales
    updateChart(labels, data) {
        if (this.chart) {
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = data;
            this.chart.update();
        }
    }
    showNotification(message, type = 'info', duration = 3000) {
        // Implementación simple de notificación
        let notif = document.createElement('div');
        notif.className = `dashboard-notification ${type}`;
        notif.textContent = message;
        notif.style.position = 'fixed';
        notif.style.top = '20px';
        notif.style.right = '20px';
        notif.style.zIndex = 9999;
        notif.style.padding = '12px 24px';
        notif.style.background = type === 'success' ? '#27ae60' : (type === 'error' ? '#e74c3c' : '#3498db');
        notif.style.color = '#fff';
        notif.style.borderRadius = '6px';
        notif.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), duration);
    }
    showLoading() {
        if (!document.getElementById('dashboard-loading')) {
            let loader = document.createElement('div');
            loader.id = 'dashboard-loading';
            loader.style.position = 'fixed';
            loader.style.top = 0;
            loader.style.left = 0;
            loader.style.width = '100vw';
            loader.style.height = '100vh';
            loader.style.background = 'rgba(255,255,255,0.7)';
            loader.style.zIndex = 9998;
            loader.innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:2rem;color:#3498db;">Cargando...</div>';
            document.body.appendChild(loader);
        }
    }
    hideLoading() {
        const loader = document.getElementById('dashboard-loading');
        if (loader) loader.remove();
    }
    updateStats(stats) {
        // Implementación básica: actualizar elementos del DOM si existen
        if (stats) {
            if (document.getElementById('total-users')) document.getElementById('total-users').textContent = stats.totalClientes ?? '';
            if (document.getElementById('total-sales')) document.getElementById('total-sales').textContent = `$${stats.ingresosTotales ?? ''}`;
            if (document.getElementById('total-orders')) document.getElementById('total-orders').textContent = stats.totalVentas ?? '';
            if (document.getElementById('monthly-revenue')) document.getElementById('monthly-revenue').textContent = `$${stats.ingresosTotales ?? ''}`;
        }
    }
    updateActivity(activities) {
        // Implementación básica: actualizar lista de actividad si existe
        if (document.getElementById('activity-list')) {
            document.getElementById('activity-list').textContent = JSON.stringify(activities);
        }
    }
    updateNotificationBadge(count) {
        // Implementación básica
        if (document.getElementById('notification-badge')) {
            document.getElementById('notification-badge').textContent = count;
        }
    }
    updateUserInfo(userName) {
        // Implementación básica
        if (document.getElementById('userNameDisplay')) {
            document.getElementById('userNameDisplay').textContent = userName;
        }
    }
    renderTable(data, columns) {
        // Implementación básica
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = row[col.key];
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }
}; // <-- End of DashboardUI class

// Instancia global para acceso desde funciones y DashboardAPI
const dashboardUI = new DashboardUI();

// ------------------- GLOBAL API & UTILS -------------------

window.DashboardAPI = {
  renderTable: function(data, columns) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.forEach(row => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        td.textContent = row[col.key];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  },
  // Update statistics
    updateStats: function(stats) {
        if (dashboardUI) {
            dashboardUI.updateStats(stats);
        }
    },
    
    // Update chart data
    updateChart: function(labels, data) {
        if (dashboardUI) {
            dashboardUI.updateChart(labels, data);
        }
    },
    
    // Render table data
    renderTable: function(data, columns) {
        if (dashboardUI) {
            dashboardUI.renderTable(data, columns);
        }
    },
    
    // Update activity feed
    updateActivity: function(activities) {
        if (dashboardUI) {
            dashboardUI.updateActivity(activities);
        }
    },
    
    // Show notifications
    showNotification: function(message, type, duration) {
        if (dashboardUI) {
            dashboardUI.showNotification(message, type, duration);
        }
    },
    
    // Show/hide loading
    showLoading: function() {
        if (dashboardUI) {
            dashboardUI.showLoading();
        }
    },
    
    hideLoading: function() {
        if (dashboardUI) {
            dashboardUI.hideLoading();
        }
    },
    
    // Show modal
    showModal: function(title, content, footer) {
        if (dashboardUI) {
            dashboardUI.showModal(title, content, footer);
        }
    },
    
    // Update notification badge
    updateNotificationBadge: function(count) {
        if (dashboardUI) {
            dashboardUI.updateNotificationBadge(count);
        }
    },
    
    // Update user info
    updateUserInfo: function(userName) {
        if (dashboardUI) {
            dashboardUI.updateUserInfo(userName);
        }
    }
};

async function eliminarProducto(id) {
  const token = localStorage.getItem('token');
  if (!token) return;
  if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.ok) {
    DashboardAPI.showNotification('Producto eliminado', 'success');
    cargarProductos();
  } else {
    DashboardAPI.showNotification('Error al eliminar producto', 'error');
  }
}

async function agregarUsuarioInterno(data) {
  const token = localStorage.getItem('token');
  if (!token) return;
  const res = await fetch('/api/users/internos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (res.ok) {
    DashboardAPI.showNotification('Usuario interno creado', 'success');
    // Recarga la lista de usuarios
    cargarUsuariosInternos();
  } else {
    DashboardAPI.showNotification('Error al crear usuario', 'error');
  }
}

async function cargarPaquetes() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/products/paquetes', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const paquetes = await res.json();
  const tbody = document.getElementById('tablaPaquetesBody');
  tbody.innerHTML = '';
  paquetes.forEach(pkg => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${pkg.nombre}</td>
      <td>${pkg.precio}</td>
      <td>
        <button class="btn-editar" data-id="${pkg.id_producto}"><i class="fas fa-edit"></i></button>
        <button class="btn-eliminar" data-id="${pkg.id_producto}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function cargarProductos() {
  console.log('Attempting to load products...');
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token found, exiting cargarProductos.');
    return;
  }
  try {
    const res = await fetch(`/api/products?_=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-cache'
    });
    if (!res.ok) {
      console.error(`Error fetching products: ${res.status} ${res.statusText}`, await res.text());
      throw new Error(`HTTP error ${res.status}`);
    }
    const productos = await res.json();
    console.log('Fetched products data:', productos);
    
    const tbody = document.getElementById('tablaProductosBody');
    if (!tbody) {
        console.error('Element with ID "tablaProductosBody" not found.');
        return;
    }
    tbody.innerHTML = '';
    productos.forEach(producto => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${producto.id_producto}</td>
      <td>${producto.nombre}</td>
      <td>${producto.descripcion || ''}</td>
      <td>${producto.precio}</td>
      <td>${producto.stock}</td>
      <td>
        <button class="btn-editar" data-id="${producto.id_producto}"><i class="fas fa-edit"></i></button>
        <button class="btn-eliminar" data-id="${producto.id_producto}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Listeners para editar y eliminar
  tbody.querySelectorAll('.btn-editar').forEach(btn => {
    btn.onclick = () => abrirModalEditarProducto(btn.getAttribute('data-id'));
  });
  tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.onclick = () => eliminarProducto(btn.getAttribute('data-id'));
  });
  } catch (err) {
    console.error('Error in cargarProductos:', err);
    if (window.DashboardAPI && typeof window.DashboardAPI.showNotification === 'function') {
      DashboardAPI.showNotification('Error al cargar productos', 'error');
    }
  }
}

async function cargarEstadisticasDashboard() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch(`/api/dashboard/stats?_=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-cache'
    });
    if (!res.ok) throw new Error('Error al obtener estadísticas');
    const stats = await res.json();
    console.log('Fetched Dashboard Stats Data:', stats);
    console.log('Updating DOM for total-users with:', stats.totalClientes ?? 0);
    document.getElementById('total-users').textContent = stats.totalClientes ?? 0;
    console.log('Updating DOM for total-sales with:', stats.ingresosTotales ?? 0);
    document.getElementById('total-sales').textContent = `$${stats.ingresosTotales ?? 0}`;
    console.log('Updating DOM for total-orders with:', stats.totalVentas ?? 0);
    document.getElementById('total-orders').textContent = stats.totalVentas ?? 0;
    console.log('Updating DOM for monthly-revenue with:', stats.ingresosTotales ?? 0);
    document.getElementById('monthly-revenue').textContent = `$${stats.ingresosTotales ?? 0}`;
  } catch (err) {
    console.error('Error in cargarEstadisticasDashboard:', err);
    if (window.DashboardAPI && typeof window.DashboardAPI.showNotification === 'function') {
      window.DashboardAPI.showNotification('Error al cargar estadísticas', 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', cargarEstadisticasDashboard);

const btnAgregarProducto = document.getElementById('btnAgregarProducto');
  if (btnAgregarProducto) {
    btnAgregarProducto.onclick = function() {
      console.log('Click en agregar producto');
      document.getElementById('modalProductoTitulo').textContent = 'Agregar Producto';
      document.getElementById('productoId').value = ''; // Clear ID for creation mode
      
      const form = document.getElementById('formProducto');
      if (form) {
        form.reset(); // Resets text, number, select to their HTML defaults
      }
      
      // Explicitly set values for fields not fully handled by form.reset() or to ensure specific defaults
      document.getElementById('productoDescripcion').value = ''; 
      document.getElementById('productoTipo').value = 'paquete'; // Default type
      const stockInput = document.getElementById('productoStock');
      if (stockInput) stockInput.value = '0'; // Default stock, ensure it's a string for .value
      document.getElementById('productoActivo').checked = true; // Default to active

      document.getElementById('modalProducto').style.display = 'block';
    };
  }

  // Botón "Guardar" del modal
  const btnGuardarProducto = document.querySelector('#modalProducto .btn.btn-primary');
  if (btnGuardarProducto) {
    btnGuardarProducto.onclick = async function() {
      const id = document.getElementById('productoId').value;
      const data = {
        nombre: document.getElementById('productoNombre').value,
        tipo: document.getElementById('productoTipo').value,
        precio: Number(document.getElementById('productoPrecio').value)
      };
      const token = localStorage.getItem('token');
      let res;
      if (id) {
        res = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
      }
      if (res.ok) {
        DashboardAPI.showNotification('Producto guardado', 'success');
        document.getElementById('modalProducto').style.display = 'none';
        cargarProductos();
      } else {
        DashboardAPI.showNotification('Error al guardar producto', 'error');
      }
    };
  }

  // Botón "Cancelar" del modal
  const btnCancelarProducto = document.getElementById('cancelarProducto');
  if (btnCancelarProducto) {
    btnCancelarProducto.onclick = function() {
      document.getElementById('modalProducto').style.display = 'none';
    };
  }

  // Botón cerrar modal
  const btnCerrarModalProducto = document.getElementById('cerrarModalProducto');
  if (btnCerrarModalProducto) {
    btnCerrarModalProducto.onclick = function() {
      document.getElementById('modalProducto').style.display = 'none';
    };
  }


async function cargarGraficoVentasPorMes() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch(`/api/dashboard/sales-by-month?_=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-cache'
    });
    if (!res.ok) throw new Error('Error al obtener ventas por mes');
    const { labels, data } = await res.json();
    console.log('Fetched Sales Chart Data:', { labels, data });
    dashboardUI.updateChart(labels, data);
  } catch (err) {
    console.error('Error in cargarGraficoVentasPorMes:', err);
    if (window.DashboardAPI && typeof window.DashboardAPI.showNotification === 'function') {
      window.DashboardAPI.showNotification('Error al cargar gráfico de ventas', 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', cargarGraficoVentasPorMes);

async function cargarActividadReciente() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch(`/api/dashboard/recent-activity?_=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-cache'
    });
    if (!res.ok) throw new Error('Error al obtener actividad reciente');
    const { pedidos, usuarios } = await res.json();
    console.log('Fetched Recent Activity Data:', { pedidos, usuarios });

    console.log('Preparing to update activity list. Pedidos:', pedidos, 'Usuarios:', usuarios);
    const actividadDiv = document.getElementById('activity-list');
    if (actividadDiv) {
        // Optional: Construct the HTML string first then log it if it's complex
        // const activityHTML = `<h4>Últimos pedidos</h4>...`;
        // console.log('Updating DOM for activity-list with HTML:', activityHTML);
        // actividadDiv.innerHTML = activityHTML;
        // For now, just logging the data again to confirm scope.
        console.log('Updating DOM for activity-list with data:', { pedidos, usuarios });
      actividadDiv.innerHTML = `
        <h4>Últimos pedidos</h4>
        <ul>
          ${pedidos.map(p => `<li><b>${p.cliente.nombre} ${p.cliente.apellido}</b> - ${new Date(p.fecha_pedido).toLocaleString()} - $${p.total}</li>`).join('')}
        </ul>
        <h4>Últimos usuarios registrados</h4>
        <ul>
          ${usuarios.map(u => `<li><b>${u.nombre} ${u.apellido}</b> - ${u.email} - ${new Date(u.fecha_registro).toLocaleDateString()}</li>`).join('')}
        </ul>
      `;
    }
  } catch (err) {
    console.error('Error in cargarActividadReciente:', err);
    if (window.DashboardAPI && typeof window.DashboardAPI.showNotification === 'function') {
      window.DashboardAPI.showNotification('Error al cargar actividad reciente', 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', cargarActividadReciente);

async function cargarUsuariosInternos() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch('/api/users/internos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Error al obtener usuarios internos');
    const data = await res.json();
    // Renderiza la tabla usando tu DashboardUI o directamente
    window.DashboardAPI.renderTable(data, [
      { key: 'nombre', label: 'Nombre' },
      { key: 'apellido', label: 'Apellido' },
      { key: 'email', label: 'Email' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'activo', label: 'Activo' }
    ]);
  } catch (err) {
    window.DashboardAPI.showNotification('Error al cargar usuarios internos', 'error');
  }
}

async function cargarPaquetes() {
  console.log('Attempting to load packages...');
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token for cargarPaquetes');
    DashboardAPI.showNotification('Autenticación requerida para cargar paquetes.', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/products/paquetes?_=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-cache'
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'No additional error text available.');
      console.error(`Error fetching packages: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`HTTP error ${res.status} when fetching packages.`);
    }
    const paquetes = await res.json();
    console.log('Fetched packages data:', paquetes);

    const tbody = document.getElementById('tablaPaquetesBody');
    if (!tbody) {
      console.error('Element with ID "tablaPaquetesBody" not found.');
      return;
    }
    tbody.innerHTML = ''; // Clear existing rows

    if (!paquetes || paquetes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay paquetes para mostrar.</td></tr>';
      return;
    }

    paquetes.forEach(paquete => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${paquete.id_producto}</td>
        <td>${paquete.nombre}</td>
        <td>${paquete.descripcion || ''}</td>
        <td>${paquete.precio}</td>
        <td>${paquete.stock !== null && paquete.stock !== undefined ? paquete.stock : ''}</td>
        <td>${paquete.activo ? 'Sí' : 'No'}</td>
        <td>
          <button class="btn btn-sm btn-primary btn-editar-info-paquete" data-id="${paquete.id_producto}" title="Editar Información del Paquete">
            <i class="fas fa-info-circle"></i> Info
          </button>
          <button class="btn btn-sm btn-secondary btn-gestionar-componentes" data-id="${paquete.id_producto}" title="Gestionar Componentes del Paquete">
            <i class="fas fa-cogs"></i> Componentes
          </button>
          <button class="btn btn-sm btn-danger btn-eliminar-paquete" data-id="${paquete.id_producto}" title="Eliminar Paquete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-editar-info-paquete').forEach(btn => {
      btn.onclick = () => abrirModalEditarProducto(btn.getAttribute('data-id'));
    });
    tbody.querySelectorAll('.btn-gestionar-componentes').forEach(btn => {
      btn.onclick = () => gestionarComponentesPaquete(btn.getAttribute('data-id'));
    });
    tbody.querySelectorAll('.btn-eliminar-paquete').forEach(btn => {
      btn.onclick = () => dashboardUI.deleteItem(btn.getAttribute('data-id'));
    });

  } catch (err) {
    console.error('Error in cargarPaquetes:', err);
    if (window.DashboardAPI && typeof window.DashboardAPI.showNotification === 'function') {
      DashboardAPI.showNotification('Error al cargar paquetes.', 'error');
    }
    const tbody = document.getElementById('tablaPaquetesBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Error al cargar paquetes.</td></tr>';
    }
  }
}

async function gestionarComponentesPaquete(packageId) {
  console.log('[gestionarComponentesPaquete] Started for packageId:', packageId);
  document.getElementById('idPaqueteGestionActual').value = packageId;
  DashboardAPI.showLoading();

  const token = localStorage.getItem('token');
  if (!token) {
    DashboardAPI.showNotification('Error de autenticación: Token no encontrado.', 'error');
    DashboardAPI.hideLoading();
    return;
  }

  try {
    // Fetch Package Details
    const resPkg = await fetch(`/api/products/${packageId}?_=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-cache'
    });

    if (!resPkg.ok) {
      const errorDataPkg = await resPkg.json().catch(() => ({ message: `Error HTTP ${resPkg.status}` }));
      DashboardAPI.showNotification(`Error al cargar datos del paquete: ${errorDataPkg.message || resPkg.statusText}`, 'error');
      console.error('Error fetching package details:', resPkg.status, resPkg.statusText, errorDataPkg);
      DashboardAPI.hideLoading();
      return;
    }
    const paquete = await resPkg.json();
    console.log('Package details for management:', paquete);
    document.getElementById('nombrePaqueteGestion').textContent = paquete.nombre || '';

    // Fetch Available Individual Products
    const resInd = await fetch(`/api/products/individuals?_=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-cache'
    });

    if (!resInd.ok) {
      const errorDataInd = await resInd.json().catch(() => ({ message: `Error HTTP ${resInd.status}` }));
      DashboardAPI.showNotification(`Error al cargar productos individuales: ${errorDataInd.message || resInd.statusText}`, 'error');
      console.error('Error fetching individual products:', resInd.status, resInd.statusText, errorDataInd);
      DashboardAPI.hideLoading();
      return;
    }
    const fetchedProductosIndividuales = await resInd.json();
    console.log('Fetched available individual products:', fetchedProductosIndividuales);

    // Filter out products already in the package and the package itself
    const currentComponentIds = new Set((paquete.componentes || []).map(c => c.id_producto));
    _globalAllAvailableIndividualProductsForModal = fetchedProductosIndividuales.filter(p => 
        !currentComponentIds.has(p.id_producto) && 
        p.id_producto !== Number(packageId)
    );
    console.log('Initially filtered available products for modal:', _globalAllAvailableIndividualProductsForModal);

    // Populate Current Components List
    const listaActualesDiv = document.getElementById('listaComponentesActuales');
    listaActualesDiv.innerHTML = ''; // Clear previous
    if (paquete.componentes && paquete.componentes.length > 0) {
      paquete.componentes.forEach(componente => {
        const div = document.createElement('div');
        div.className = 'componente-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '5px 0';
        div.innerHTML = `
          <span>${componente.nombre} (ID: ${componente.id_producto})</span>
          <button class="btn btn-sm btn-danger btn-remove-component" data-component-id="${componente.id_producto}" style="margin-left: 10px;">Quitar</button>
        `;
        listaActualesDiv.appendChild(div);
      });
    } else {
      listaActualesDiv.innerHTML = '<p>Este paquete aún no tiene componentes.</p>';
    }

    // Populate Available Individual Products List using the new render function
    renderAvailableIndividualProducts(_globalAllAvailableIndividualProductsForModal);
    
    document.getElementById('modalGestionarComponentes').style.display = 'block';
  } catch (err) {
    console.error('Error in gestionarComponentesPaquete:', err);
    DashboardAPI.showNotification('Error al gestionar componentes del paquete.', 'error');
  } finally {
    DashboardAPI.hideLoading();
  }
}

// Global variable to store available individual products for the manage components modal
let _globalAllAvailableIndividualProductsForModal = [];

function renderAvailableIndividualProducts(productsToDisplay) {
  const listaDisponiblesDiv = document.getElementById('listaProductosIndividualesDisponibles');
  if (!listaDisponiblesDiv) {
    console.error('Element with ID "listaProductosIndividualesDisponibles" not found for rendering.');
    return;
  }
  listaDisponiblesDiv.innerHTML = ''; // Clear previous content

  if (!productsToDisplay || productsToDisplay.length === 0) {
    listaDisponiblesDiv.innerHTML = '<p>No hay productos que coincidan con su búsqueda o no hay más productos disponibles para agregar.</p>';
    return;
  }

  productsToDisplay.forEach(productoInd => {
    const div = document.createElement('div');
    div.className = 'producto-individual-item'; // For potential styling
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.style.padding = '5px 0';
    div.innerHTML = `
      <span>${productoInd.nombre} (Tipo: ${productoInd.tipo || 'N/A'}, ID: ${productoInd.id_producto})</span>
      <div style="display: flex; align-items: center; gap: 5px;">
        <input type="number" class="form-control form-control-sm componente-cantidad" value="1" min="1" style="width: 60px;">
        <button class="btn btn-sm btn-success btn-add-component" data-product-id="${productoInd.id_producto}" style="margin-left: 10px;">Agregar</button>
      </div>
    `;
    listaDisponiblesDiv.appendChild(div);
  });
  // Note: Event listeners for .btn-add-component will be handled in a subsequent step (5.4)
}

async function handleRemoveComponent(event) {
  if (!event.target.classList.contains('btn-remove-component')) {
    return;
  }

  const packageId = document.getElementById('idPaqueteGestionActual').value;
  const componentProductId = event.target.dataset.componentId;

  if (!packageId || !componentProductId || isNaN(Number(packageId)) || isNaN(Number(componentProductId))) {
    DashboardAPI.showNotification('Error: IDs de paquete o componente inválidos para eliminación.', 'error');
    console.error('Invalid packageId or componentProductId for handleRemoveComponent');
    return;
  }

  console.log(`Removing component ${componentProductId} from package ${packageId}`);

  try {
    DashboardAPI.showLoading();
    const token = localStorage.getItem('token');
    if (!token) {
        DashboardAPI.showNotification('Error de autenticación: Token no encontrado.', 'error');
        DashboardAPI.hideLoading();
        return;
    }

    const res = await fetch(`/api/paquetes/${packageId}/details/${componentProductId}?_=${Date.now()}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (res.ok) {
        DashboardAPI.showNotification('Componente eliminado del paquete con éxito.', 'success');
        // Refresh modal content by re-calling gestionarComponentesPaquete
        await gestionarComponentesPaquete(packageId);
    } else {
        const errorData = await res.json().catch(() => ({ message: 'Error desconocido al procesar la respuesta del servidor.' }));
        DashboardAPI.showNotification(`Error al eliminar componente: ${errorData.message || res.statusText}`, 'error');
        console.error('Error removing component:', res.status, res.statusText, errorData);
    }
  } catch (err) {
    console.error('Fetch error in handleRemoveComponent:', err);
    DashboardAPI.showNotification('Error de red al eliminar componente.', 'error');
  } finally {
    DashboardAPI.hideLoading();
  }
}

async function handleAddComponent(event) {
  if (!event.target.classList.contains('btn-add-component')) {
    return;
  }

  const packageId = document.getElementById('idPaqueteGestionActual').value;
  const componentProductId = event.target.dataset.productId;
  
  const itemDiv = event.target.closest('.producto-individual-item');
  const quantityInput = itemDiv ? itemDiv.querySelector('.componente-cantidad') : null;
  const quantity = Number(quantityInput ? quantityInput.value : 1);

  if (!packageId || !componentProductId || isNaN(Number(packageId)) || isNaN(Number(componentProductId))) {
    DashboardAPI.showNotification('Error: IDs de paquete o componente inválidos.', 'error');
    console.error('Invalid packageId or componentProductId for handleAddComponent');
    return;
  }
  if (isNaN(quantity) || quantity <= 0) {
    DashboardAPI.showNotification('Error: Cantidad inválida. Debe ser un número positivo.', 'error');
    console.error('Invalid quantity for handleAddComponent');
    return;
  }

  console.log(`Adding component ${componentProductId} (qty: ${quantity}) to package ${packageId}`);

  try {
    DashboardAPI.showLoading();
    const token = localStorage.getItem('token');
    if (!token) {
        DashboardAPI.showNotification('Error de autenticación: Token no encontrado.', 'error');
        DashboardAPI.hideLoading();
        return;
    }

    const res = await fetch(`/api/paquetes/${packageId}/details`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id_producto: Number(componentProductId), cantidad: quantity })
    });

    if (res.ok) {
        DashboardAPI.showNotification('Componente agregado al paquete con éxito.', 'success');
        // Refresh modal content by re-calling gestionarComponentesPaquete
        await gestionarComponentesPaquete(packageId); 
    } else {
        const errorData = await res.json().catch(() => ({ message: 'Error desconocido al procesar la respuesta del servidor.' }));
        DashboardAPI.showNotification(`Error al agregar componente: ${errorData.message || res.statusText}`, 'error');
        console.error('Error adding component:', res.status, res.statusText, errorData);
    }
  } catch (err) {
    console.error('Fetch error in handleAddComponent:', err);
    DashboardAPI.showNotification('Error de red al agregar componente.', 'error');
  } finally {
    DashboardAPI.hideLoading();
  }
}

async function abrirModalEditarProducto(id) {
  console.log('Abriendo modal para editar producto ID:', id);
  const token = localStorage.getItem('token');
  if (!token) {
    DashboardAPI.showNotification('Error de autenticación: Token no encontrado.', 'error');
    return;
  }
  try {
    const res = await fetch(`/api/products/${id}?_=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-cache'
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: `Error HTTP ${res.status}` }));
      DashboardAPI.showNotification(`Error al cargar datos del producto: ${errorData.message || res.statusText}`, 'error');
      console.error('Error fetching product data for edit:', res.status, res.statusText, errorData);
      return;
    }
    const producto = await res.json();
    console.log('Datos para editar:', producto);

    document.getElementById('productoId').value = producto.id_producto;
    document.getElementById('productoNombre').value = producto.nombre || '';
    document.getElementById('productoDescripcion').value = producto.descripcion || '';
    document.getElementById('productoTipo').value = producto.tipo || ''; // producto.tipo is the string name
    document.getElementById('productoPrecio').value = producto.precio !== undefined ? producto.precio : '';
    document.getElementById('productoStock').value = producto.stock !== undefined ? producto.stock : '';
    document.getElementById('productoActivo').checked = producto.activo === true;
    
    document.getElementById('modalProductoTitulo').textContent = 'Editar Producto';
    document.getElementById('modalProducto').style.display = 'block';
  } catch (err) {
    console.error('Error en abrirModalEditarProducto:', err);
    DashboardAPI.showNotification('Error al procesar la solicitud para editar producto.', 'error');
  }
}

