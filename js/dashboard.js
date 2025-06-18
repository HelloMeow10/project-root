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
            if (tabUsuariosInternos) tabUsuariosInternos.click();
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
          const data = {
            nombre: document.getElementById('productoNombre').value,
            tipo: document.getElementById('productoTipo').value,
            precio: Number(document.getElementById('productoPrecio').value)
          };
          const token = localStorage.getItem('token');
          console.log('Enviando producto:', data); // <-- agrega esto
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
          console.log('Respuesta:', res.status); // <-- agrega esto
          if (res.ok) {
            DashboardAPI.showNotification('Producto guardado', 'success');
            cerrarModalProducto();
            cargarProductos();
          } else {
            DashboardAPI.showNotification('Error al guardar producto', 'error');
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
        if (pageId === 'products') { // <-- aquí el cambio
            cargarProductos();
        }
        // Override this method to handle page-specific logic
        // This is where you would trigger data loading for each page
        console.log(`Page ${pageId} shown - trigger data loading here`);
        document.dispatchEvent(new CustomEvent('pageChanged', { 
            detail: { page: pageId } 
        }));
    }

    // Sidebar Methods
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

    updateChart(labels, data) {
        if (!this.chart) return;
        
        console.log('DashboardUI.updateChart - Applying to chart:', { labels, data });
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update();
    }

    updateChartPeriod(period) {
        // Emit event for external data loading
        document.dispatchEvent(new CustomEvent('chartPeriodChanged', { 
            detail: { period } 
        }));
    }

    // Table Methods
    renderTable(data, columns) {
        const tableBody = document.getElementById('tableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.style.animationDelay = `${index * 0.05}s`;
            row.classList.add('fade-in');
            
            columns.forEach(column => {
                const cell = document.createElement('td');
                
                if (column.type === 'status') {
                    cell.innerHTML = `<span class="status ${item[column.key]}">${this.formatStatus(item[column.key])}</span>`;
                } else if (column.type === 'actions') {
                    cell.innerHTML = this.generateActionButtons(item.id);
                } else if (column.type === 'currency') {
                    cell.textContent = this.formatCurrency(item[column.key]);
                } else if (column.type === 'date') {
                    cell.textContent = this.formatDate(item[column.key]);
                } else {
                    cell.textContent = item[column.key] || '';
                }
                
                row.appendChild(cell);
            });
            
            tableBody.appendChild(row);
        });
        
        this.updatePagination(data.length);
    }

    generateActionButtons(id) {
        return `
            <button class="btn btn-sm btn-primary" onclick="dashboardUI.editItem(${id})" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="dashboardUI.deleteItem(${id})" title="Eliminar">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }

    handleSort(column) {
        const direction = this.sortDirection[column] === 'asc' ? 'desc' : 'asc';
        this.sortDirection[column] = direction;
        
        // Update sort indicators
        document.querySelectorAll('[data-sort]').forEach(header => {
            header.classList.remove('sorted');
            const icon = header.querySelector('i');
            icon.className = 'fas fa-sort';
        });
        
        const header = document.querySelector(`[data-sort="${column}"]`);
        header.classList.add('sorted');
        const icon = header.querySelector('i');
        icon.className = `fas fa-sort-${direction === 'asc' ? 'up' : 'down'}`;
        
        // Emit sort event
        document.dispatchEvent(new CustomEvent('tableSort', { 
            detail: { column, direction } 
        }));
    }

    handleStatusFilter(status) {
        document.dispatchEvent(new CustomEvent('statusFilter', { 
            detail: { status } 
        }));
    }

    // Pagination Methods
    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationInfo = document.getElementById('paginationInfo');
        const pageNumbers = document.getElementById('pageNumbers');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (paginationInfo) {
            const start = (this.currentPage - 1) * this.itemsPerPage + 1;
            const end = Math.min(this.currentPage * this.itemsPerPage, totalItems);
            paginationInfo.textContent = `Mostrando ${start}-${end} de ${totalItems} registros`;
        }
        
        if (pageNumbers) {
            pageNumbers.innerHTML = '';
            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement('span');
                pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => this.goToPage(i));
                pageNumbers.appendChild(pageBtn);
            }
        }
        
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages;
    }

    goToPage(page) {
        this.currentPage = page;
        document.dispatchEvent(new CustomEvent('pageChanged', { 
            detail: { page } 
        }));
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    }

    nextPage() {
        this.goToPage(this.currentPage + 1);
    }

    // Statistics Methods
    updateStats(stats) {
        Object.keys(stats).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                this.animateCounter(element, stats[key]);
            }
        });
    }

    animateCounter(element, targetValue) {
        const startValue = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            
            if (element.id.includes('sales') || element.id.includes('revenue')) {
                element.textContent = this.formatCurrency(currentValue);
            } else {
                element.textContent = currentValue.toLocaleString();
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Activity Methods
    updateActivity(activities) {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        activityList.innerHTML = '';
        
        activities.forEach((activity, index) => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.style.animationDelay = `${index * 0.1}s`;
            
            item.innerHTML = `
                <div class="activity-icon ${activity.type}">
                    <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                </div>
                <div class="activity-time">${this.formatTimeAgo(activity.timestamp)}</div>
            `;
            
            activityList.appendChild(item);
        });
    }

    refreshActivity() {
        const refreshBtn = document.getElementById('refreshActivity');
        const icon = refreshBtn.querySelector('i');
        
        icon.style.animation = 'spin 1s linear infinite';
        
        // Emit refresh event
        document.dispatchEvent(new CustomEvent('refreshActivity'));
        
        setTimeout(() => {
            icon.style.animation = '';
        }, 1000);
    }

    getActivityIcon(type) {
        const icons = {
            user: 'user-plus',
            order: 'shopping-bag',
            payment: 'credit-card',
            product: 'box',
            system: 'cog'
        };
        return icons[type] || 'info-circle';
    }

    // Notification Methods
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });
    }

    removeNotification(notification) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Loading Methods
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    // Utility Methods
    formatCurrency(value) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES');
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours} h`;
        return `Hace ${days} días`;
    }

    formatStatus(status) {
        const translations = {
            active: 'Activo',
            inactive: 'Inactivo',
            pending: 'Pendiente'
        };
        return translations[status] || status;
    }

    // Event Handlers
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

    handleResize() {
        this.isMobile = window.innerWidth <= 768;
        
        if (this.chart) {
            this.chart.resize();
        }
        
        // Close sidebar on desktop
        if (!this.isMobile) {
            this.closeSidebar();
        }
    }

    handleExport() {
        // Emit export event
        document.dispatchEvent(new CustomEvent('exportData', { 
            detail: { page: this.currentPage } 
        }));
        
        this.showNotification('Exportando datos...', 'info');
    }

    // Animation Methods
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

    // Public API Methods (to be called from external scripts)
    editItem(id) {
        document.dispatchEvent(new CustomEvent('editItem', { 
            detail: { id, page: this.currentPage } 
        }));
    }

    deleteItem(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
            document.dispatchEvent(new CustomEvent('deleteItem', { 
                detail: { id, page: this.currentPage } 
            }));
        }
    }

    // Update notification badge
    updateNotificationBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Update user info
    updateUserInfo(userName) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
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

    async toggleUsuarioInternoActivo(id, nuevoEstado) {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`/api/users/internos/${id}/activo`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ activo: nuevoEstado })
        });
        if (!res.ok) throw new Error('Error al actualizar estado');
        this.showNotification('Estado actualizado', 'success');
        // Recarga la tabla
        this.setupEventListeners(); // O llama a cargarUsuariosInternos()
      } catch (err) {
        this.showNotification('Error al actualizar estado', 'error');
      }
    }

    async eliminarUsuarioInterno(id) {
      const token = localStorage.getItem('token');
      if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
      try {
        const res = await fetch(`/api/users/internos/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error al eliminar usuario');
        this.showNotification('Usuario eliminado', 'success');
        // Recarga la tabla
        this.setupEventListeners(); // O llama a cargarUsuariosInternos()
      } catch (err) {
        this.showNotification('Error al eliminar usuario', 'error');
      }
    }

    // Método para abrir el modal y cargar datos
    async abrirModalEditarUsuario(id) {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/internos/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usuario = await res.json();
      document.getElementById('editIdUsuario').value = usuario.id_usuario;
      document.getElementById('editNombre').value = usuario.nombre;
      document.getElementById('editApellido').value = usuario.apellido || '';
      document.getElementById('editEmail').value = usuario.email;
      document.getElementById('editTelefono').value = usuario.telefono || '';
      document.getElementById('editRol').value = usuario.id_rol || '';
      document.getElementById('modalEditarUsuario').style.display = 'block';
    }
}

// Ejemplo de función para cargar productos
function cargarVistaProductos() {
  document.getElementById('dashboardContent').innerHTML = '<h2>Productos</h2>';
  // Aquí puedes cargar la tabla de productos...
}
function cargarVistaUsuarios() {
  document.getElementById('dashboardContent').innerHTML = '<h2>Usuarios</h2>';
  // Aquí puedes cargar la tabla de usuarios...
}
function cargarVistaPaquetes() {
  document.getElementById('dashboardContent').innerHTML = '<h2>Paquetes</h2>';
  // Aquí puedes cargar la tabla de paquetes...
}

// Global utility functions for external use
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
  const token = localStorage.getItem('token');
  if (!token) return;
  const res = await fetch('/api/products', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const productos = await res.json();
  console.log('Productos recibidos:', productos); // <-- depuración
  const tbody = document.getElementById('tablaProductosBody');
  tbody.innerHTML = '';
  productos.forEach(producto => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${producto.id}</td>
      <td>${producto.nombre}</td>
      <td>${producto.descripcion || ''}</td>
      <td>${producto.precio}</td>
      <td>${producto.stock}</td>
      <td>
        <button class="btn-editar" data-id="${producto.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-eliminar" data-id="${producto.id}"><i class="fas fa-trash"></i></button>
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
      console.log('Click en agregar producto'); // <-- agrega esto
      document.getElementById('modalProductoTitulo').textContent = 'Agregar Producto';
      document.getElementById('productoId').value = '';
      document.getElementById('productoNombre').value = '';
      document.getElementById('productoTipo').value = 'paquete';
      document.getElementById('productoPrecio').value = '';
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

const dashboardUI = new DashboardUI();

async function abrirModalEditarProducto(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/products/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const producto = await res.json();
  // Aquí deberías mostrar el modal y rellenar los campos con los datos de producto
  // Por ejemplo:
  // document.getElementById('editNombre').value = producto.nombre;
  // ...
}

