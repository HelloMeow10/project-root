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

        document.getElementById('tabUsuariosInternos').onclick = async () => {
          document.getElementById('usuariosInternosTable').style.display = '';
          document.getElementById('clientesTable').style.display = 'none';
          document.getElementById('tabUsuariosInternos').classList.add('active');
          document.getElementById('tabClientes').classList.remove('active');
          const res = await fetch('/api/users/internos');
          const data = await res.json();
          dashboardUI.renderUsuariosInternosTable(data);
        };

        document.getElementById('tabClientes').onclick = async () => {
          document.getElementById('usuariosInternosTable').style.display = 'none';
          document.getElementById('clientesTable').style.display = '';
          document.getElementById('tabUsuariosInternos').classList.remove('active');
          document.getElementById('tabClientes').classList.add('active');
          const res = await fetch('/api/users/clientes');
          const data = await res.json();
          dashboardUI.renderClientesTable(data);
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
        // Override this method to handle page-specific logic
        // This is where you would trigger data loading for each page
        console.log(`Page ${pageId} shown - trigger data loading here`);
        
        // Example: Emit custom event for data loading
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
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Ventas',
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
        
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update('active');
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
              <td>${u.id}</td>
              <td>${u.nombre}</td>
              <td>${u.apellido || ''}</td>
              <td>${u.email}</td>
              <td>${u.telefono || ''}</td>
              <td>${u.activo ? 'Sí' : 'No'}</td>
              <td>${u.id_rol || ''}</td>
            `;
            tbody.appendChild(tr);
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
}

// Initialize Dashboard UI when DOM is loaded
let dashboardUI;

document.addEventListener('DOMContentLoaded', async function() {
  dashboardUI = new DashboardUI();
  // Carga inicial
  const res = await fetch('/api/users/internos');
  const data = await res.json();
  dashboardUI.renderUsuariosInternosTable(data);
});

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

