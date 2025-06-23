document.addEventListener('DOMContentLoaded', function () {
    const orderListContainer = document.getElementById('orderList');
    const noOrdersMessage = document.getElementById('noOrdersMessage');
    const orderItemTemplate = document.getElementById('orderItemTemplate');
    const orderProductItemTemplate = document.getElementById('orderProductItemTemplate');
    const loadingOverlay = document.getElementById('loadingOverlayMisPedidos');
    const notificationContainer = document.getElementById('notificationContainer');
    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    let currentAction = null;

    function showLoading(show) {
        if (loadingOverlay) loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    function showNotification(text, type = 'info', duration = 4000) {
        if (!notificationContainer) return;
        const notification = document.createElement('div');
        notification.className = `notification ${type}`; // Asegúrate que carrito.css tiene estas clases
        notification.innerHTML = `<span>${text}</span><button class="notification-close">&times;</button>`;
        notificationContainer.appendChild(notification);
        notification.querySelector('.notification-close').onclick = () => notification.remove();
        setTimeout(() => notification.remove(), duration);
    }

    function openModal(title, message, onConfirm) {
        if (!modal || !modalTitle || !modalMessage || !modalConfirmBtn || !modalCancelBtn) return;
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Clonar y reemplazar el botón para evitar listeners duplicados
        const newConfirmBtn = modalConfirmBtn.cloneNode(true);
        modalConfirmBtn.parentNode.replaceChild(newConfirmBtn, modalConfirmBtn);
        newConfirmBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            closeModal();
        });
        modalConfirmBtn = newConfirmBtn; // Actualizar la referencia

        modal.style.display = 'block';
    }

    function closeModal() {
        if (modal) modal.style.display = 'none';
    }

    if (modalCloseBtn) modalCloseBtn.onclick = closeModal;
    if (modalCancelBtn) modalCancelBtn.onclick = closeModal;
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }

    async function fetchMisPedidos() {
        showLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Debes iniciar sesión para ver tus pedidos.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
            showLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/orders/my-orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('tipo');
                showNotification('Sesión inválida. Redirigiendo al login...', 'error');
                setTimeout(() => window.location.href = 'login.html', 2000);
                return;
            }
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Error ${response.status} al cargar pedidos`);
            }

            const pedidos = await response.json();
            renderPedidos(pedidos);

        } catch (error) {
            console.error('Error fetching pedidos:', error);
            showNotification(error.message || 'No se pudieron cargar los pedidos.', 'error');
            if (orderListContainer) orderListContainer.innerHTML = '<p>Error al cargar pedidos.</p>';
            if (noOrdersMessage) noOrdersMessage.style.display = 'block';
        } finally {
            showLoading(false);
        }
    }

    function renderPedidos(pedidos) {
        if (!orderListContainer || !orderItemTemplate || !noOrdersMessage || !orderProductItemTemplate) {
            console.error('Elementos del DOM para pedidos no encontrados.');
            return;
        }
        orderListContainer.innerHTML = ''; 

        if (pedidos.length === 0) {
            noOrdersMessage.style.display = 'block';
            return;
        }
        noOrdersMessage.style.display = 'none';

        pedidos.forEach(pedido => {
            const pedidoClone = orderItemTemplate.content.cloneNode(true);
            const orderItemDiv = pedidoClone.querySelector('.order-item');
            
            orderItemDiv.dataset.orderId = pedido.id_pedido;
            pedidoClone.querySelector('.order-id').textContent = pedido.id_pedido;
            
            const statusSpan = pedidoClone.querySelector('.order-status');
            statusSpan.textContent = pedido.estado.replace('_', ' ').toUpperCase();
            statusSpan.className = `order-status status-${pedido.estado.toLowerCase()}`;

            pedidoClone.querySelector('.order-date').textContent = new Date(pedido.fecha_pedido).toLocaleDateString();
            pedidoClone.querySelector('.order-total').textContent = parseFloat(pedido.total).toFixed(2);

            const productListUl = pedidoClone.querySelector('ul');
            pedido.items.forEach(item => {
                const productItemClone = orderProductItemTemplate.content.cloneNode(true);
                productItemClone.querySelector('.product-name').textContent = item.producto?.nombre || 'Producto desconocido';
                productItemClone.querySelector('.product-quantity').textContent = item.cantidad;
                productItemClone.querySelector('.product-price').textContent = parseFloat(item.precio).toFixed(2);
                productListUl.appendChild(productItemClone);
            });

            const actionsDiv = pedidoClone.querySelector('.order-actions');
            if (pedido.estado === 'PENDIENTE_PAGO') {
                const cancelButton = document.createElement('button');
                cancelButton.textContent = 'Cancelar Pedido';
                cancelButton.onclick = () => confirmarCancelacionPedido(pedido.id_pedido);
                actionsDiv.appendChild(cancelButton);
            }

            orderListContainer.appendChild(pedidoClone);
        });
    }

    function confirmarCancelacionPedido(pedidoId) {
        openModal(
            'Confirmar Cancelación',
            `¿Estás seguro de que deseas cancelar el pedido #${pedidoId}? Esta acción no se puede deshacer y el stock será repuesto.`,
            async () => {
                await cancelarPedido(pedidoId);
            }
        );
    }

    async function cancelarPedido(pedidoId) {
        showLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/orders/${pedidoId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'CANCELADO' })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                 throw new Error(errData.message || `Error ${response.status} al cancelar el pedido`);
            }
            showNotification('Pedido cancelado exitosamente.', 'success');
            fetchMisPedidos(); // Recargar la lista
        } catch (error) {
            console.error('Error cancelando pedido:', error);
            showNotification(error.message || 'No se pudo cancelar el pedido.', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    // Cargar el contador del carrito en el header
    async function updateCartCountHeader() {
        const token = localStorage.getItem('token');
        const cartCountSpan = document.getElementById('cartCountHeader');
        if (!cartCountSpan) return;

        if (!token) {
            cartCountSpan.textContent = '0';
            return;
        }
        try {
            const res = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const items = await res.json();
                cartCountSpan.textContent = items.length;
            } else {
                cartCountSpan.textContent = '0';
            }
        } catch (e) {
            cartCountSpan.textContent = '0';
        }
    }

    fetchMisPedidos();
    updateCartCountHeader();
});
