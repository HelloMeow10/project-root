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
        this.currentPage = 1; // Sobrescribe el anterior, intencional si es para paginación general
        this.itemsPerPage = 10;

        this.clientesData = new Map();
        this.usuariosInternosData = new Map();

        
        this.handleProductSearch = this.handleProductSearch.bind(this); // Bind here
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

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleGlobalSearch(e.target.value));
        }

        const tableSearch = document.getElementById('tableSearch');
        if (tableSearch) {
            tableSearch.addEventListener('input', (e) => this.handleTableSearch(e.target.value));
        }

        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        const chartPeriod = document.getElementById('chart-period');
        if (chartPeriod) {
            chartPeriod.addEventListener('change', (e) => this.updateChartPeriod(e.target.value));
        }

        document.querySelectorAll('[data-sort]').forEach(header => {
            header.addEventListener('click', (e) => this.handleSort(e.target.dataset.sort));
        });

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e.target.value));
        }

        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        if (prevPage) prevPage.addEventListener('click', () => this.previousPage());
        if (nextPage) nextPage.addEventListener('click', () => this.nextPage());

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }

        const refreshActivity = document.getElementById('refreshActivity');
        if (refreshActivity) {
            refreshActivity.addEventListener('click', () => this.refreshActivity());
        }

        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(); // Cierra el modal genérico
                // También cierra otros modales específicos si están abiertos
                const modalEditarCliente = document.getElementById('modalEditarCliente');
                if (modalEditarCliente && modalEditarCliente.style.display === 'block' && e.target === modalEditarCliente) {
                    modalEditarCliente.style.display = 'none';
                }
                const modalEditarUsuario = document.getElementById('modalEditarUsuario');
                if (modalEditarUsuario && modalEditarUsuario.style.display === 'block' && e.target === modalEditarUsuario) {
                    modalEditarUsuario.style.display = 'none';
                }
                const modalAnadirUsuarioInterno = document.getElementById('modalAnadirUsuarioInterno');
                if (modalAnadirUsuarioInterno && modalAnadirUsuarioInterno.style.display === 'block' && e.target === modalAnadirUsuarioInterno) {
                    modalAnadirUsuarioInterno.style.display = 'none';
                    document.getElementById('formAnadirUsuarioInterno').reset();
                }
                 const modalProducto = document.getElementById('modalProducto');
                if (modalProducto && modalProducto.style.display === 'block' && e.target === modalProducto) {
                    cerrarModalProducto();
                }
                 const modalGestionarComponentes = document.getElementById('modalGestionarComponentes');
                if (modalGestionarComponentes && modalGestionarComponentes.style.display === 'block' && e.target === modalGestionarComponentes) {
                     document.getElementById('modalGestionarComponentes').style.display = 'none';
                }
            }
        });

        window.addEventListener('resize', () => this.handleResize());



            // Search input for Manage Package Components Modal
            const buscarProductoIndividualInput = document.getElementById('buscarProductoIndividual');
            if (buscarProductoIndividualInput) {
                buscarProductoIndividualInput.addEventListener('input', this.handleProductSearch);
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


        const tabUsuariosInternos = document.getElementById('tabUsuariosInternos');
        const tabClientes = document.getElementById('tabClientes');
        const usuariosInternosTable = document.getElementById('usuariosInternosTable'); // El div que contiene la tabla
        const clientesTable = document.getElementById('clientesTable'); // El div que contiene la tabla

        if (tabUsuariosInternos && tabClientes && usuariosInternosTable && clientesTable) {
          tabUsuariosInternos.onclick = async () => {
            console.log("Cambiando a pestaña Usuarios Internos. Limpiando contexto...");
            const tableSearchInput = document.getElementById('tableSearch');

            if (tableSearchInput) tableSearchInput.value = '';

            tabUsuariosInternos.classList.add('active');
            tabClientes.classList.remove('active');
            // Asegurarse que los contenedores de tabla se muestran/ocultan, no las tablas mismas si están dentro de estos divs.
            document.getElementById('usuariosInternosContent').style.display = ''; // O el div que realmente controla la visibilidad
            document.getElementById('clientesContent').style.display = 'none'; // O el div que realmente controla la visibilidad

            await this.cargarYRenderizarUsuariosInternos();
          };
          tabClientes.onclick = async () => {
            console.log("Cambiando a pestaña Clientes. Limpiando contexto...");
            const tableSearchInput = document.getElementById('tableSearch');
            if (tableSearchInput) tableSearchInput.value = '';

            tabClientes.classList.add('active');
            tabUsuariosInternos.classList.remove('active');
            document.getElementById('usuariosInternosContent').style.display = 'none';
            document.getElementById('clientesContent').style.display = '';

            await this.cargarYRenderizarClientes();
          };
          if (this.currentPage === 'usuarios') {
            // Simula el click solo si estamos en la página de usuarios y no hay una sub-pestaña ya activa
             const isActiveClients = tabClientes.classList.contains('active');
             if (!isActiveClients) { // Si clientes no está activo, activa usuarios internos
                tabUsuariosInternos.click();
             }
          }
        }


        const modalEditarCliente = document.getElementById('modalEditarCliente');
        const formEditarCliente = document.getElementById('formEditarCliente');
        const cerrarModalEditarClienteBtn = document.getElementById('cerrarModalEditarCliente');
        const cancelarEditarClienteBtn = document.getElementById('cancelarEditarCliente');


        if (modalEditarCliente) {
            if (cerrarModalEditarClienteBtn) {
                cerrarModalEditarClienteBtn.onclick = () => modalEditarCliente.style.display = 'none';
            }
            if (cancelarEditarClienteBtn) {
                cancelarEditarClienteBtn.onclick = () => modalEditarCliente.style.display = 'none';
            }
        }

        if (formEditarCliente) {
            formEditarCliente.onsubmit = async (e) => {
                e.preventDefault();
                const idCliente = document.getElementById('editIdCliente').value;
                const data = {
                    nombre: document.getElementById('editNombreCliente').value,
                    apellido: document.getElementById('editApellidoCliente').value,
                    email: document.getElementById('editEmailCliente').value,
                    telefono: document.getElementById('editTelefonoCliente').value,
                    direccion: document.getElementById('editDireccionCliente').value,
                };
                const token = localStorage.getItem('token');
                if (!token) {
                    this.showNotification('Error de autenticación.', 'error'); // Usar this.showNotification
                    return;
                }
                try {
                    this.showLoading();
                    const res = await fetch(`/api/users/clientes/${idCliente}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(data)
                    });
                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({ message: `Error al actualizar cliente: ${res.statusText}` }));
                        throw new Error(errorData.message);
                    }
                    this.showNotification('Cliente actualizado con éxito.', 'success');
                    modalEditarCliente.style.display = 'none';
                    await this.cargarYRenderizarClientes();
                } catch (error) {
                    console.error(error);
                    this.showNotification(error.message, 'error');
                } finally {
                    this.hideLoading();
                }
            };
        }

        const formAgregarPaquete = document.getElementById('formAgregarPaquete');
        if (formAgregarPaquete) {
            formAgregarPaquete.onsubmit = async (e) => { // Cambiado a arrow function
              e.preventDefault();
              const nombre = document.getElementById('nombrePaquete').value;
              const precio = document.getElementById('precioPaquete').value;
              const token = localStorage.getItem('token');
              if (!token) {
                this.showNotification('Error de autenticación.', 'error');
                return;
              }
              try {
                this.showLoading();
                const res = await fetch('/api/products/paquetes', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ nombre, precio })
                });
                if (res.ok) {
                  this.showNotification('Paquete añadido', 'success');
                  await this.cargarYRenderizarPaquetes(); // Usar método de clase
                  formAgregarPaquete.reset(); // 'this' aquí es el form, no DashboardUI, por eso se usa formAgregarPaquete.reset()
                } else {
                  const errorData = await res.json().catch(() => ({ message: `Error al añadir paquete: ${res.statusText}` }));
                  throw new Error(errorData.message);
                }
              } catch(error) {
                this.showNotification(error.message, 'error');
              } finally {
                this.hideLoading();
              }
            };
        }

        document.getElementById('cerrarModalEditar').onclick = () => { // Arrow function
          document.getElementById('modalEditarUsuario').style.display = 'none';
        };
        document.getElementById('cancelarEditarUsuario').onclick = () => { // Arrow function
          document.getElementById('modalEditarUsuario').style.display = 'none';
        };


        const formEditarUsuario = document.getElementById('formEditarUsuario');
        if (formEditarUsuario) {
            formEditarUsuario.onsubmit = async (e) => {

              e.preventDefault();
              const id = document.getElementById('editIdUsuario').value;
              const data = {
                nombre: document.getElementById('editNombre').value,
                apellido: document.getElementById('editApellido').value,
                email: document.getElementById('editEmail').value,
                telefono: document.getElementById('editTelefono').value,

                id_rol: parseInt(document.getElementById('editRol').value, 10)
              };

              if (isNaN(data.id_rol)) {
                this.showNotification('ID de Rol inválido. Debe ser un número.', 'error');
                return;
              }
              const token = localStorage.getItem('token');
              if (!token) {
                this.showNotification('Error de autenticación.', 'error');
                return;
              }
              try {
                this.showLoading();

                const res = await fetch(`/api/users/internos/${id}`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(data)
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ message: `Error al actualizar usuario interno: ${res.statusText}` }));
                    throw new Error(errorData.message);
                }

                this.showNotification('Usuario interno actualizado con éxito.', 'success');
                document.getElementById('modalEditarUsuario').style.display = 'none';
                await this.cargarYRenderizarUsuariosInternos();
              } catch (error) {
                console.error(error);
                this.showNotification(error.message, 'error');
              } finally {
                this.hideLoading();
              }
            };

        }

        const btnAnadirUsuarioInterno = document.getElementById('btnAnadirUsuarioInterno');
        if (btnAnadirUsuarioInterno) {
            btnAnadirUsuarioInterno.addEventListener('click', () => this.abrirModalAnadirUsuarioInterno());
        }

        const modalAnadirUsuarioInterno = document.getElementById('modalAnadirUsuarioInterno');
        const formAnadirUsuarioInterno = document.getElementById('formAnadirUsuarioInterno');
        const cerrarModalAnadirUsuarioInternoBtn = document.getElementById('cerrarModalAnadirUsuarioInterno');
        const cancelarAnadirUsuarioInternoBtn = document.getElementById('cancelarAnadirUsuarioInterno');

        if (modalAnadirUsuarioInterno) {
            if (cerrarModalAnadirUsuarioInternoBtn) {
                cerrarModalAnadirUsuarioInternoBtn.onclick = () => {
                    modalAnadirUsuarioInterno.style.display = 'none';
                    if (formAnadirUsuarioInterno) formAnadirUsuarioInterno.reset();
                };
            }
            if (cancelarAnadirUsuarioInternoBtn) {
                cancelarAnadirUsuarioInternoBtn.onclick = () => {
                    modalAnadirUsuarioInterno.style.display = 'none';
                    if (formAnadirUsuarioInterno) formAnadirUsuarioInterno.reset();
                };
            }
        }

        if (formAnadirUsuarioInterno) {
            formAnadirUsuarioInterno.onsubmit = async (e) => {
                e.preventDefault();
                this.showLoading();
                const nombre = document.getElementById('anadirNombre').value.trim();
                const apellido = document.getElementById('anadirApellido').value.trim();
                const email = document.getElementById('anadirEmail').value.trim();
                const contrasena = document.getElementById('anadirContrasena').value;
                const telefono = document.getElementById('anadirTelefono').value.trim();
                const idRol = document.getElementById('anadirRol').value;
                if (!nombre || !email || !contrasena || !idRol) {
                    this.showNotification('Por favor, complete todos los campos requeridos, incluyendo el rol.', 'error');
                    this.hideLoading();
                    return;
                }
                if (!/^\S+@\S+\.\S+$/.test(email)) {
                    this.showNotification('Formato de email inválido.', 'error');
                    this.hideLoading();
                    return;
                }
                const id_rol_numerico = parseInt(idRol, 10);
                if (isNaN(id_rol_numerico)) {
                    this.showNotification('Rol seleccionado inválido.', 'error');
                    this.hideLoading();
                    return;
                }
                const data = { nombre, apellido, email, contrasena, telefono, id_rol: id_rol_numerico };
                const token = localStorage.getItem('token');
                if (!token) {
                    this.showNotification('Error de autenticación. Por favor, inicie sesión de nuevo.', 'error');
                    this.hideLoading();
                    return;
                }
                try {
                    const res = await fetch('/api/users/internos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                        body: JSON.stringify(data)
                    });
                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({ message: `Error al crear usuario: ${res.statusText}` }));
                        throw new Error(errorData.message);
                    }
                    this.showNotification('Usuario interno creado con éxito.', 'success');
                    modalAnadirUsuarioInterno.style.display = 'none';
                    formAnadirUsuarioInterno.reset();
                    await this.cargarYRenderizarUsuariosInternos();
                } catch (error) {
                    console.error('Error al crear usuario interno:', error);
                    this.showNotification(error.message, 'error');
                } finally {
                    this.hideLoading();
                }
            };
        }

        document.getElementById('cerrarModalProducto').onclick = cerrarModalProducto; // Global
        document.getElementById('cancelarProducto').onclick = cerrarModalProducto; // Global

        const formProducto = document.getElementById('formProducto');
        if(formProducto) {
            formProducto.onsubmit = async (e) => { // Arrow function
              e.preventDefault();
              const id = document.getElementById('productoId').value;
              const formData = {
                nombre: document.getElementById('productoNombre').value,
                descripcion: document.getElementById('productoDescripcion').value,
                tipo: document.getElementById('productoTipo').value,
                precio: Number(document.getElementById('productoPrecio').value),
                stock: Number(document.getElementById('productoStock').value),
                activo: document.getElementById('productoActivo').checked
              };
              const token = localStorage.getItem('token');
              if (!token) {
                this.showNotification('Error de autenticación.', 'error');
                return;
              }
              let method = 'POST';
              let url = `/api/products?_=${Date.now()}`;
              if (id) {
                method = 'PUT';
                url = `/api/products/${id}?_=${Date.now()}`;
              }
              console.log(`Enviando producto (${method}):`, formData, 'to URL:', url);
              try {
                this.showLoading();
                const res = await fetch(url, {
                  method: method,
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
                  body: JSON.stringify(formData)
                });
                console.log('Respuesta del servidor:', res.status);
                if (res.ok) {
                  this.showNotification(`Producto ${id ? 'actualizado' : 'creado'} con éxito`, 'success');
                  cerrarModalProducto(); // Global
                  await this.cargarYRenderizarProductos();
                } else {
                  const errorData = await res.json().catch(() => ({ message: 'Error desconocido al procesar la respuesta.' }));
                  throw new Error(`Error al ${id ? 'actualizar' : 'crear'} producto: ${errorData.message || res.statusText}`);
                }
              } catch (err) {
                console.error('Error de red o fetch al guardar producto:', err);
                this.showNotification(err.message, 'error');
              } finally {
                this.hideLoading();
              }
            };
        }
    }

    handleNavigation(e) {
        console.log('[handleNavigation] Event target:', e.target);
        e.preventDefault();
        const link = e.target.closest('.nav-link');
        if (!link) {
            console.error('[handleNavigation] No .nav-link found for event target:', e.target);
            return;
        }
        const page = link.dataset.page;
        console.log('[handleNavigation] Navigating to pageId:', page);

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        this.showPage(page);
        if (this.isMobile) {
            this.closeSidebar();
        }
    }

    showPage(pageId) {
        console.log(`[showPage] Attempting to show pageId: '${pageId}'`);

        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none';
        });

        const targetPage = document.getElementById(`${pageId}-page`);
        
        if (targetPage) {
            console.log(`[showPage] Found target page element for ID: ${pageId}-page`, targetPage);
            targetPage.classList.add('active');

            targetPage.style.display = 'block';
            this.currentPage = pageId;
            console.log(`[showPage] Current page set to: '${this.currentPage}'`);
            this.onPageShow(pageId);

        } else {
            console.error(`[showPage] Target page element NOT FOUND for ID: '${pageId}-page'. Check HTML structure and pageId spelling.`);
        }
    }

    onPageShow(pageId) {
        console.log(`[onPageShow] Initializing content for page: '${pageId}'`);

        if (pageId === 'productos') {
            this.cargarYRenderizarProductos();
        } else if (pageId === 'paquetes') {
            this.cargarYRenderizarPaquetes();
        } else if (pageId === 'usuarios') {
             console.log("[onPageShow] Matched 'usuarios'. Logic for this page (e.g., clicking default tab) is handled in setupEventListeners or tab click handlers.");
        } else {
            console.log(`[onPageShow] No specific on-page-show action defined for pageId '${pageId}'.`);
        }
        console.log(`[onPageShow] Dispatching 'pageChanged' event for pageId: '${pageId}'.`);
        document.dispatchEvent(new CustomEvent('pageChanged', { detail: { page: pageId } }));

        console.log(`[onPageShow] Finished processing for pageId: '${pageId}'.`);
    }

    handleProductSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        // _globalAllAvailableIndividualProductsForModal and renderAvailableIndividualProducts are still global
        const filteredProducts = _globalAllAvailableIndividualProductsForModal.filter(prod =>
            prod.nombre.toLowerCase().includes(searchTerm) ||
            (prod.tipo && prod.tipo.toLowerCase().includes(searchTerm))
        );
        renderAvailableIndividualProducts(filteredProducts);
    }

} // End of DashboardUI class definition

// Instantiated AFTER class definition
const dashboardUI = new DashboardUI();

// Sidebar Methods

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('show');
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('show');
    }

    handleGlobalSearch(query = '') {
        document.dispatchEvent(new CustomEvent('globalSearch', { detail: { query, page: this.currentPage } }));
    }

    handleTableSearch(query) {
        document.dispatchEvent(new CustomEvent('tableSearch', { detail: { query } }));
    }

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

    initializeChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;
        this.chart = new Chart(ctx.getContext('2d'), { /* ... chart config ... */ });
    }

    renderUsuariosInternosTable(data) {
        const tbody = document.getElementById('usuariosInternosTableBody');
        tbody.innerHTML = '';

        this.usuariosInternosData.clear();
        data.forEach(u => {
            const userId = u.id_usuario;
            this.usuariosInternosData.set(String(userId), u);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${userId}</td>
                <td>${u.nombre}</td>
                <td>${u.apellido || ''}</td>
                <td>${u.email}</td>
                <td>${u.telefono || ''}</td>
                <td>${u.activo ? 'Sí' : 'No'}</td>
                <td>${u.id_rol || ''}</td>
                <td>
                    <button class="btn btn-sm btn-info btn-editar-usuario-interno" data-id="${u.id_usuario}">Editar</button>
                    <button class="btn btn-sm ${u.activo ? 'btn-warning' : 'btn-success'} btn-toggle-usuario-interno" data-id="${u.id_usuario}" data-activo="${u.activo}">
                        ${u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="btn btn-sm btn-danger btn-eliminar-usuario-interno" data-id="${u.id_usuario}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderClientesTable(data) {
        const tbody = document.getElementById('clientesTableBody');
        tbody.innerHTML = '';

        this.clientesData.clear();
        data.forEach(cliente => {
            const clienteId = cliente.id_cliente || cliente.id;
            this.clientesData.set(String(clienteId), cliente);

            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${clienteId}</td>
              <td>${cliente.nombre}</td>
              <td>${cliente.apellido || ''}</td>
              <td>${cliente.email}</td>
              <td>${cliente.telefono || ''}</td>
              <td>${cliente.direccion || ''}</td>
              <td>${cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString() : ''}</td>
              <td>${cliente.activo ? 'Sí' : 'No'}</td>
              <td>${cliente.email_verificado ? 'Sí' : 'No'}</td>
              <td>
                <button class="btn btn-sm btn-info btn-editar-cliente" data-id="${clienteId}">Editar</button>
                <button class="btn btn-sm ${cliente.activo ? 'btn-warning' : 'btn-success'} btn-toggle-cliente" data-id="${clienteId}" data-activo="${cliente.activo}">
                  ${cliente.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button class="btn btn-sm btn-danger btn-eliminar-cliente" data-id="${clienteId}">Eliminar</button>
              </td>
            `;
            tbody.appendChild(tr);
        });
    }


    handleUsuariosInternosTableClick(event) {
        const target = event.target;
        const userId = target.dataset.id;

        if (target.classList.contains('btn-editar-usuario-interno')) {
            this.handleEditarUsuarioInternoClick(userId, event);
        } else if (target.classList.contains('btn-toggle-usuario-interno')) {
            const isActive = target.dataset.activo === 'true';
            this.handleToggleUsuarioInternoClick(userId, !isActive, event);
        } else if (target.classList.contains('btn-eliminar-usuario-interno')) {
            this.handleEliminarUsuarioInternoClick(userId, event);
        }

    }

    handleClientesTableClick(event) {
        const target = event.target;
        const clienteId = target.dataset.id;
        if (target.classList.contains('btn-editar-cliente')) {
            this.handleEditarClienteClick(clienteId, event);
        } else if (target.classList.contains('btn-toggle-cliente')) {
            const isActive = target.dataset.activo === 'true';
            this.handleToggleClienteClick(clienteId, !isActive, event);
        } else if (target.classList.contains('btn-eliminar-cliente')) {
            this.handleEliminarClienteClick(clienteId, event);
        }
    }

    abrirModalAnadirUsuarioInterno() {
        const modal = document.getElementById('modalAnadirUsuarioInterno');
        const form = document.getElementById('formAnadirUsuarioInterno');
        if (form) form.reset();
        if (modal) modal.style.display = 'block';
    }

    async abrirModalEditarUsuarioInterno(userId) {
        const usuario = this.usuariosInternosData.get(String(userId));
        if (!usuario) {
            this.showNotification('Error: No se pudieron obtener los datos del usuario interno para editar.', 'error');
            console.error(`Usuario interno con ID ${userId} no encontrado en this.usuariosInternosData`);
            return;
        }
        document.getElementById('editIdUsuario').value = usuario.id_usuario;
        document.getElementById('editNombre').value = usuario.nombre || '';
        document.getElementById('editApellido').value = usuario.apellido || '';
        document.getElementById('editEmail').value = usuario.email || '';
        document.getElementById('editTelefono').value = usuario.telefono || '';
        document.getElementById('editRol').value = usuario.id_rol || '';
        document.getElementById('modalEditarUsuario').style.display = 'block';
    }

    handleEditarUsuarioInternoClick(userId, event) {
        console.log(`Intentando abrir modal para editar usuario interno ID: ${userId}`, event);
        this.abrirModalEditarUsuarioInterno(userId);
    }

    async cargarYRenderizarUsuariosInternos() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.showNotification('Error de autenticación.', 'error');
            return;
        }
        try {
            this.showLoading();
            const res = await fetch('/api/users/internos', { headers: { 'Authorization': `Bearer ${token}` }});
            if (!res.ok) {
                 const errorData = await res.json().catch(() => ({ message: `Error al cargar usuarios internos: ${res.statusText}` }));
                 throw new Error(errorData.message);
            }
            const data = await res.json();
            this.renderUsuariosInternosTable(data);
        } catch (error) {
            console.error(error);
            this.showNotification(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleToggleUsuarioInternoClick(userId, newActiveState, event) {
        // ... (lógica existente, asegurar uso de this.showNotification, this.cargarYRenderizarUsuariosInternos)
        const token = localStorage.getItem('token');
        if(!token){ this.showNotification('Error de autenticación.', 'error'); return; }
        try {
            this.showLoading();
            const res = await fetch(`/api/users/internos/${userId}/activo`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify({ activo: newActiveState })
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: `Error al cambiar estado: ${res.statusText}` }));
                throw new Error(errorData.message);
            }
            this.showNotification(`Usuario interno ${newActiveState ? 'activado' : 'desactivado'} con éxito.`, 'success');
            await this.cargarYRenderizarUsuariosInternos();
        } catch (error) {
            this.showNotification(error.message || 'Error al cambiar estado del usuario interno.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleEliminarUsuarioInternoClick(userId, event) {
        // ... (lógica existente, asegurar uso de this.showNotification, this.cargarYRenderizarUsuariosInternos)
        if (confirm(`¿Estás seguro de que deseas eliminar al usuario interno ID: ${userId}? Esta acción no se puede deshacer.`)) {
            const token = localStorage.getItem('token');
            if(!token){ this.showNotification('Error de autenticación.', 'error'); return; }
            try {
                this.showLoading();
                const res = await fetch(`/api/users/internos/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ message: `Error al eliminar: ${res.statusText}` }));
                    throw new Error(errorData.message);
                }
                this.showNotification('Usuario interno eliminado con éxito.', 'success');
                await this.cargarYRenderizarUsuariosInternos();
            } catch (error) {
                this.showNotification(error.message || 'Error al eliminar el usuario interno.', 'error');
            } finally {
                this.hideLoading();
            }
        }
    }

    async abrirModalEditarCliente(clienteId) {
        const cliente = this.clientesData.get(String(clienteId));
        if (!cliente) {
            this.showNotification('Error: No se pudieron obtener los datos del cliente para editar.', 'error');
            return;
        }
        document.getElementById('editIdCliente').value = cliente.id_cliente || cliente.id;
        document.getElementById('editNombreCliente').value = cliente.nombre || '';
        // ... (resto de campos)
        document.getElementById('modalEditarCliente').style.display = 'block';
    }
    
    handleEditarClienteClick(clienteId, event) {
        this.abrirModalEditarCliente(clienteId);
    }

    async cargarYRenderizarClientes() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.showNotification('Error de autenticación.', 'error');
            return;
        }
        try {
            this.showLoading();
            const res = await fetch('/api/users/clientes', { headers: { 'Authorization': `Bearer ${token}` }});
            if (!res.ok) {
                 const errorData = await res.json().catch(() => ({ message: `Error al cargar clientes: ${res.statusText}` }));
                 throw new Error(errorData.message);
            }
            const data = await res.json();
            this.renderClientesTable(data);
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleToggleClienteClick(clienteId, newActiveState, event) {
        // ... (lógica existente, asegurar uso de this.showNotification, this.cargarYRenderizarClientes)
        const token = localStorage.getItem('token');
        if(!token){ this.showNotification('Error de autenticación.', 'error'); return; }
        try {
            this.showLoading();
            const res = await fetch(`/api/users/clientes/${clienteId}/activo`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify({ activo: newActiveState })
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: `Error al cambiar estado: ${res.statusText}` }));
                throw new Error(errorData.message);
            }
            this.showNotification(`Cliente ${newActiveState ? 'activado' : 'desactivado'} con éxito.`, 'success');
            await this.cargarYRenderizarClientes();
        } catch (error) {
            this.showNotification(error.message || 'Error al cambiar estado del cliente.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleEliminarClienteClick(clienteId, event) {
        // ... (lógica existente, asegurar uso de this.showNotification, this.cargarYRenderizarClientes)
        if (confirm(`¿Estás seguro de que deseas eliminar al cliente ID: ${clienteId}? Esta acción no se puede deshacer.`)) {
            const token = localStorage.getItem('token');
            if(!token){ this.showNotification('Error de autenticación.', 'error'); return; }
            try {
                this.showLoading();
                const res = await fetch(`/api/users/clientes/${clienteId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ message: `Error al eliminar: ${res.statusText}` }));
                    throw new Error(errorData.message);
                }
                this.showNotification('Cliente eliminado con éxito.', 'success');
                await this.cargarYRenderizarClientes();
            } catch (error) {
                this.showNotification(error.message || 'Error al eliminar el cliente.', 'error');
            } finally {
                this.hideLoading();
            }
        }
    }

    setupResponsiveHandlers() {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        mediaQuery.addListener((e) => { this.isMobile = e.matches; if (!this.isMobile) this.closeSidebar(); });
    }

    initializeAnimations() {
        const style = document.createElement('style');
        style.textContent = `/* ... CSS de animaciones ... */`;
        document.head.appendChild(style);
    }

    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { /* ... */ }
        if (e.key === 'Escape') this.closeModal();
    }

    updateChart(labels, data) { /* ... */ }
    showNotification(message, type = 'info', duration = 3000) { /* ... */ }
    showLoading() { /* ... */ }
    hideLoading() { /* ... */ }
    updateStats(stats) { /* ... */ }
    updateActivity(activities) { /* ... */ }
    updateNotificationBadge(count) { /* ... */ }
    updateUserInfo(userName) { /* ... */ }
    renderTable(data, columns) { /* ... */ } // Este renderTable genérico parece no usarse para las tablas específicas.

    // NUEVOS MÉTODOS DE CLASE PARA CARGAR PRODUCTOS Y PAQUETES
    async cargarYRenderizarProductos() {
        console.log('[DashboardUI] Attempting to load products...');
        this.showLoading();
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('[DashboardUI] No token found, exiting cargarYRenderizarProductos.');
            this.showNotification('Autenticación requerida.', 'error');
            this.hideLoading();
            return;
        }
        try {
            const res = await fetch(`/api/products?_=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-cache'
            });
            if (!res.ok) {
                const errorText = await res.text().catch(() => 'No additional error text available.');
                console.error(`[DashboardUI] Error fetching products: ${res.status} ${res.statusText}`, errorText);
                throw new Error(`HTTP error ${res.status}`);
            }
            const productos = await res.json();
            console.log('[DashboardUI] Fetched products data:', productos);

            const tbody = document.getElementById('tablaProductosBody');
            if (!tbody) {
                console.error('[DashboardUI] Element with ID "tablaProductosBody" not found.');
                this.hideLoading();
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
                    <button class="btn btn-sm btn-info btn-editar" data-id="${producto.id_producto}"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn btn-sm btn-danger btn-eliminar" data-id="${producto.id_producto}"><i class="fas fa-trash"></i> Eliminar</button>
                  </td>
                `;
                tbody.appendChild(tr);
            });

            tbody.querySelectorAll('.btn-editar').forEach(btn => {
                btn.onclick = () => abrirModalEditarProducto(btn.getAttribute('data-id')); // Global
            });
            tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
                btn.onclick = () => eliminarProducto(btn.getAttribute('data-id')); // Global
            });
        } catch (err) {
            console.error('[DashboardUI] Error in cargarYRenderizarProductos:', err);
            this.showNotification('Error al cargar productos.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async cargarYRenderizarPaquetes() {
        console.log('[DashboardUI] Attempting to load packages...');
        this.showLoading();
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('[DashboardUI] No token for cargarYRenderizarPaquetes');
            this.showNotification('Autenticación requerida para cargar paquetes.', 'error');
            this.hideLoading();
            return;
        }

        try {
            const res = await fetch(`/api/products/paquetes?_=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-cache'
            });

            if (!res.ok) {
                const errorText = await res.text().catch(() => 'No additional error text available.');
                console.error(`[DashboardUI] Error fetching packages: ${res.status} ${res.statusText}`, errorText);
                throw new Error(`HTTP error ${res.status} when fetching packages.`);
            }
            const paquetes = await res.json();
            console.log('[DashboardUI] Fetched packages data:', paquetes);

            const tbody = document.getElementById('tablaPaquetesBody');
            if (!tbody) {
                console.error('[DashboardUI] Element with ID "tablaPaquetesBody" not found.');
                this.hideLoading();
                return;
            }
            tbody.innerHTML = '';

            if (!paquetes || paquetes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay paquetes para mostrar.</td></tr>';
            } else {
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
                    btn.onclick = () => abrirModalEditarProducto(btn.getAttribute('data-id')); // Global
                });
                tbody.querySelectorAll('.btn-gestionar-componentes').forEach(btn => {
                    btn.onclick = () => gestionarComponentesPaquete(btn.getAttribute('data-id')); // Global
                });
                tbody.querySelectorAll('.btn-eliminar-paquete').forEach(btn => {
                     btn.onclick = () => eliminarProducto(btn.getAttribute('data-id')); // Global, asumiendo que es genérico
                });
            }
        } catch (err) {
            console.error('[DashboardUI] Error in cargarYRenderizarPaquetes:', err);
            this.showNotification('Error al cargar paquetes.', 'error');
        } finally {
            this.hideLoading();
        }
    }
}; // <-- End of DashboardUI class

const dashboardUI = new DashboardUI(); // Instancia global


const dashboardUI = new DashboardUI(); // MOVED HERE

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


window.DashboardAPI = {
  // ... (métodos existentes que llaman a dashboardUI.metodo())
    updateStats: function(stats) { if (dashboardUI) dashboardUI.updateStats(stats); },
    updateChart: function(labels, data) { if (dashboardUI) dashboardUI.updateChart(labels, data); },
    // renderTable no parece ser usado directamente por los nuevos métodos de clase para tablas específicas
    // updateActivity: function(activities) { if (dashboardUI) dashboardUI.updateActivity(activities); },
    showNotification: function(message, type, duration) { if (dashboardUI) dashboardUI.showNotification(message, type, duration); },
    showLoading: function() { if (dashboardUI) dashboardUI.showLoading(); },
    hideLoading: function() { if (dashboardUI) dashboardUI.hideLoading(); },
    showModal: function(title, content, footer) { if (dashboardUI) dashboardUI.showModal(title, content, footer); },
    updateNotificationBadge: function(count) { if (dashboardUI) dashboardUI.updateNotificationBadge(count); },
    updateUserInfo: function(userName) { if (dashboardUI) dashboardUI.updateUserInfo(userName); }
};

// Funciones globales que aún pueden ser llamadas desde los métodos de clase o desde otros lugares
// Idealmente, estas también se refactorizarían a métodos de clase o a un servicio separado si crecen mucho.

async function eliminarProducto(id) {
  const token = localStorage.getItem('token');
  if (!token) {
    dashboardUI.showNotification('Autenticación requerida.', 'error'); // Usar dashboardUI
    return;
  }
  if (!confirm('¿Seguro que deseas eliminar este producto/paquete?')) return;

  dashboardUI.showLoading(); // Usar dashboardUI
  try {
    const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
        dashboardUI.showNotification('Elemento eliminado con éxito.', 'success');
        // Recargar la vista actual de forma inteligente
        if (dashboardUI.currentPage === 'productos') {
            await dashboardUI.cargarYRenderizarProductos();
        } else if (dashboardUI.currentPage === 'paquetes') {
            await dashboardUI.cargarYRenderizarPaquetes();
        }
    } else {
        const errorData = await res.json().catch(() => ({ message: 'Error al eliminar.'}));
        throw new Error(errorData.message);
    }
  } catch(error) {
    dashboardUI.showNotification(error.message, 'error');
  } finally {
    dashboardUI.hideLoading();
  }
}

// La función agregarUsuarioInterno se mantiene global, pero usa dashboardUI para notificaciones y recarga
async function agregarUsuarioInterno(data) { // Esta es la función global, no el submit handler del form
  const token = localStorage.getItem('token');
  if (!token) {
    dashboardUI.showNotification('Autenticación requerida.', 'error');
    return;
  }
  dashboardUI.showLoading();
  try {
    const res = await fetch('/api/users/internos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
      body: JSON.stringify(data)
    });
    if (res.ok) {
      dashboardUI.showNotification('Usuario interno creado con éxito.', 'success');
      await dashboardUI.cargarYRenderizarUsuariosInternos();
    } else {
      const errorData = await res.json().catch(() => ({ message: 'Error al crear usuario.'}));
      throw new Error(errorData.message);
    }
  } catch (error) {
     dashboardUI.showNotification(error.message, 'error');
  } finally {
    dashboardUI.hideLoading();
  }
}


// Funciones globales que permanecen por ahora (usadas por listeners en los métodos de clase)
// Idealmente, también se refactorizarían.
function cerrarModalProducto() {
  document.getElementById('modalProducto').style.display = 'none';
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

// const dashboardUI = new DashboardUI(); // Ensuring this is removed if it was here


async function abrirModalEditarProducto(id) {
  // ... (lógica existente, usa DashboardAPI.showNotification que a su vez usa dashboardUI)
  // Esta función ya usa DashboardAPI.showNotification, así que indirectamente usa los métodos de dashboardUI.
  // No necesita this.showLoading/hideLoading a menos que se mueva a la clase.
  const token = localStorage.getItem('token');
  if (!token) {
    DashboardAPI.showNotification('Error de autenticación: Token no encontrado.', 'error');
    return;
  }
  DashboardAPI.showLoading();
  try {
    const res = await fetch(`/api/products/${id}?_=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-cache'
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: `Error HTTP ${res.status}` }));
      throw new Error(`Error al cargar datos del producto: ${errorData.message || res.statusText}`);
    }
    const producto = await res.json();
    document.getElementById('modalProductoTitulo').textContent = 'Editar Producto';
    document.getElementById('productoId').value = producto.id_producto || producto.id; // Asegurar que se usa id_producto consistentemente
    document.getElementById('productoNombre').value = producto.nombre || '';
    document.getElementById('productoDescripcion').value = producto.descripcion || '';
    document.getElementById('productoTipo').value = producto.tipo || '';
    document.getElementById('productoPrecio').value = producto.precio !== undefined ? producto.precio : '';
    document.getElementById('productoStock').value = producto.stock !== undefined ? producto.stock : '';
    document.getElementById('productoActivo').checked = producto.activo === true;
    document.getElementById('modalProducto').style.display = 'block';
  } catch (err) {
    console.error('Error en abrirModalEditarProducto:', err);
    DashboardAPI.showNotification(err.message, 'error');
  } finally {
    DashboardAPI.hideLoading();
  }
}
// La función global gestionarComponentesPaquete permanece sin cambios por ahora.
async function gestionarComponentesPaquete(packageId) { /* ... lógica existente ... */ }
let _globalAllAvailableIndividualProductsForModal = [];
function renderAvailableIndividualProducts(productsToDisplay) { /* ... lógica existente ... */ }
async function handleRemoveComponent(event) { /* ... lógica existente ... */ }
async function handleAddComponent(event) { /* ... lógica existente ... */ }


// Funciones que ya no son necesarias o cuya lógica se ha movido/integrado:
/*
async function cargarProductos() { ... } // Movida a DashboardUI.cargarYRenderizarProductos
async function cargarPaquetes() { ... } // Movida a DashboardUI.cargarYRenderizarPaquetes
async function cargarUsuariosInternos() { ... } // Movida a DashboardUI.cargarYRenderizarUsuariosInternos
*/

// Funciones de carga inicial que aún son globales
async function cargarEstadisticasDashboard() { /* ... */ }
async function cargarGraficoVentasPorMes() { /* ... */ }
async function cargarActividadReciente() { /* ... */ }

document.addEventListener('DOMContentLoaded', () => {
    // dashboardUI ya está instanciada arriba.
    // Las llamadas a funciones de carga inicial pueden permanecer aquí o moverse a init si prefieres
    cargarEstadisticasDashboard();
    cargarGraficoVentasPorMes();
    cargarActividadReciente();

    // Configuración de listeners que dependen de dashboardUI (si los hubiera)
    // Por ejemplo, si el logoutBtn estuviera fuera de la clase:
    // const logoutBtn = document.getElementById('logoutBtn');
    // if (logoutBtn) logoutBtn.onclick = () => dashboardUI.logout(); // Asumiendo que logout es un método
});

// Listeners para botones de modales que no están dentro de la clase (si los hubiera)
// Ejemplo de btnAgregarProducto, si su lógica no estuviera ya en setupEventListeners
const btnAgregarProducto = document.getElementById('btnAgregarProducto');
if (btnAgregarProducto) {
    btnAgregarProducto.onclick = function() {
      document.getElementById('modalProductoTitulo').textContent = 'Agregar Producto';
      document.getElementById('productoId').value = '';
      const form = document.getElementById('formProducto');
      if (form) form.reset();
      document.getElementById('productoDescripcion').value = '';
      document.getElementById('productoTipo').value = 'paquete';
      const stockInput = document.getElementById('productoStock');
      if (stockInput) stockInput.value = '0';
      document.getElementById('productoActivo').checked = true;
      document.getElementById('modalProducto').style.display = 'block';
    };
}

// El formProducto.onsubmit ya fue adaptado para usar this.showNotification y this.cargarYRenderizarProductos
// a través de la instancia dashboardUI.
// La función global cerrarModalProducto() se mantiene.
