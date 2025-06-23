class CartUI {
  constructor() {
    this.isLoading = false;
    this.cartItems = []; // Store items locally for rendering
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupTemplates();
    this.updateCartDisplay();
    this.setupFormValidation();
    this.setupAnimations();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.quantity-btn')) {
        this.handleQuantityChange(e.target.closest('.quantity-btn'));
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('quantity-input')) {
        this.handleQuantityInput(e.target);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('.remove-item-btn')) {
        this.handleRemoveItem(e.target.closest('.remove-item-btn'));
      }
    });

    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => this.handleClearCart());
    }

    const promoForm = document.getElementById('promoForm');
    if (promoForm) {
      promoForm.addEventListener('submit', (e) => this.handlePromoCode(e));
    }

    const confirmarCompraBtn = document.getElementById('confirmarCompraBtn');
    if (confirmarCompraBtn) {
      confirmarCompraBtn.addEventListener('click', () => this.handleCheckout());
    }

    document.addEventListener('click', (e) => {
      if (e.target.closest('.add-recommended-btn')) {
        this.handleAddRecommended(e.target.closest('.add-recommended-btn'));
      }
    });

    this.setupModalControls();

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('notification-close')) {
        this.closeNotification(e.target.closest('.notification'));
      }
    });

    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  async handleQuantityChange(button) {
    const itemId = button.dataset.itemId;
    const quantityInput = document.querySelector(`.quantity-input[data-item-id="${itemId}"]`);
    const isIncrease = button.classList.contains('increase');

    if (!quantityInput) {
      console.error(`Quantity input not found for itemId: ${itemId}`);
      return;
    }

    let currentValue = parseInt(quantityInput.value) || 1;
    const min = parseInt(quantityInput.min) || 1;
    const max = parseInt(quantityInput.max) || 10;

    if (isIncrease && currentValue < max) {
      currentValue++;
    } else if (!isIncrease && currentValue > min) {
      currentValue--;
    } else {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const tipo = localStorage.getItem('tipo');
      if (!token || tipo !== 'cliente') {
        this.showNotification('Debes iniciar sesión como cliente para actualizar la cantidad', 'error');
        setTimeout(() => window.location.href = tipo === 'admin' ? '/dashboard.html' : '/login.html', 1500);
        return;
      }

      const res = await fetch(`/api/cart/item/${itemId}`, {
        method: 'PUT', // Cambiado de PATCH a PUT
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cantidad: currentValue }),
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('tipo');
        this.showNotification('Sesión inválida. Por favor, inicia sesión nuevamente.', 'error');
        setTimeout(() => window.location.href = '/login.html', 1500);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to update quantity: ${res.status} - ${errorData.message || 'Unknown error'}`);
      }

      console.log(`Quantity updated for itemId: ${itemId}, new value: ${currentValue}`);
      quantityInput.value = currentValue;
      await this.refreshCart();
      this.addQuantityFeedback(button, isIncrease);
    } catch (err) {
      console.error('Quantity Update Error:', err);
      this.showNotification('Error al actualizar la cantidad', 'error');
    }
  }

  async handleQuantityInput(input) {
    const itemId = input.dataset.itemId;
    let value = parseInt(input.value) || 1;
    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max) || 10;

    if (value < min) value = min;
    if (value > max) value = max;

    try {
      const token = localStorage.getItem('token');
      const tipo = localStorage.getItem('tipo');
      if (!token || tipo !== 'cliente') {
        this.showNotification('Debes iniciar sesión como cliente para actualizar la cantidad', 'error');
        setTimeout(() => window.location.href = tipo === 'admin' ? '/dashboard.html' : '/login.html', 1500);
        return;
      }

      const res = await fetch(`/api/cart/item/${itemId}`, {
        method: 'PUT', // Cambiado de PATCH a PUT
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cantidad: value }),
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('tipo');
        this.showNotification('Sesión inválida. Por favor, inicia sesión nuevamente.', 'error');
        setTimeout(() => window.location.href = '/login.html', 1500);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to update quantity: ${res.status} - ${errorData.message || 'Unknown error'}`);
      }

      console.log(`Quantity input updated for itemId: ${itemId}, new value: ${value}`);
      input.value = value;
      await this.refreshCart();
    } catch (err) {
      console.error('Quantity Input Error:', err);
      this.showNotification('Error al actualizar la cantidad', 'error');
    }
  }

  addQuantityFeedback(button, isIncrease) {
    button.style.transform = 'scale(0.95)';
    button.style.background = 'var(--primary-color)';
    button.style.color = 'white';

    setTimeout(() => {
      button.style.transform = '';
      button.style.background = '';
      button.style.color = '';
    }, 150);
  }

  updateCartTotals() {
    let hotelSubtotal = 0;
    let flightSubtotal = 0;
    let otherSubtotal = 0;

    document.querySelectorAll('.cart-item').forEach((item) => {
      const itemType = item.dataset.itemType?.toLowerCase() || 'unknown';
      const totalPriceElement = item.querySelector('.total-price-amount');

      if (totalPriceElement) {
        const price = parseFloat(totalPriceElement.textContent.replace(/[^0-9.]/g, '')) || 0;

        if (itemType === 'hotel') {
          hotelSubtotal += price;
        } else if (itemType === 'vuelo') {
          flightSubtotal += price;
        } else {
          otherSubtotal += price;
        }
      }
    });

    const hotelSubtotalElement = document.getElementById('hotelSubtotal');
    const flightSubtotalElement = document.getElementById('flightSubtotal');
    const totalAmountElement = document.getElementById('totalAmount');

    if (hotelSubtotalElement) hotelSubtotalElement.textContent = `$${hotelSubtotal.toFixed(2)}`;
    if (flightSubtotalElement) flightSubtotalElement.textContent = `$${flightSubtotal.toFixed(2)}`;

    const discountAmount = parseFloat(document.getElementById('discountAmount')?.textContent.replace(/[^0-9.]/g, '')) || 0;
    const taxAmount = parseFloat(document.getElementById('taxAmount')?.textContent.replace(/[^0-9.]/g, '')) || 0;

    const total = hotelSubtotal + flightSubtotal + otherSubtotal - discountAmount + taxAmount;

    if (totalAmountElement) {
      totalAmountElement.textContent = `$${total.toFixed(2)}`;

      totalAmountElement.style.transform = 'scale(1.05)';
      setTimeout(() => {
        totalAmountElement.style.transform = '';
      }, 300);
    }

    this.updateCartCount();
  }

  updateCartCount() {
    const cartItems = document.querySelectorAll('.cart-item');
    const cartCount = document.getElementById('cartCount');

    if (cartCount) {
      cartCount.textContent = cartItems.length;
      cartCount.style.display = cartItems.length > 0 ? 'flex' : 'none';
    }
  }

  handleRemoveItem(button) {
    const itemId = button.dataset.itemId;
    const cartItem = button.closest('.cart-item');

    if (!cartItem) {
      console.error(`Cart item not found for itemId: ${itemId}`);
      return;
    }

    const itemTitle = cartItem.querySelector('.item-title')?.textContent || 'este producto';

    this.showConfirmationModal(
      'Eliminar Producto',
      `¿Estás seguro de que deseas eliminar "${itemTitle}" del carrito?`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          const tipo = localStorage.getItem('tipo');
          if (!token || tipo !== 'cliente') {
            this.showNotification('Debes iniciar sesión como cliente para eliminar el producto', 'error');
            setTimeout(() => window.location.href = tipo === 'admin' ? '/dashboard.html' : '/login.html', 1500);
            return;
          }

          const res = await fetch(`/api/cart/item/${itemId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('tipo');
            this.showNotification('Sesión inválida. Por favor, inicia sesión nuevamente.', 'error');
            setTimeout(() => window.location.href = '/login.html', 1500);
            return;
          }

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(`Failed to remove item: ${res.status} - ${errorData.message || 'Unknown error'}`);
          }

          console.log(`Removed item: ${itemId}`);
          this.removeItemWithAnimation(cartItem);
          this.showNotification('Producto eliminado del carrito', 'success');
          await this.refreshCart();
        } catch (err) {
          console.error('Remove Item Error:', err);
          this.showNotification('Error al eliminar el producto', 'error');
        }
      }
    );
  }

  removeItemWithAnimation(cartItem) {
    cartItem.style.transform = 'translateX(-100%)';
    cartItem.style.opacity = '0';

    setTimeout(() => {
      cartItem.remove();
      this.updateCartDisplay();
    }, 300);
  }

  handleClearCart() {
    const cartItems = document.querySelectorAll('.cart-item');

    if (cartItems.length === 0) {
      this.showNotification('El carrito ya está vacío', 'info');
      return;
    }

    this.showConfirmationModal(
      'Vaciar Carrito',
      '¿Estás seguro de que deseas eliminar todos los productos del carrito?',
      async () => {
        try {
          const token = localStorage.getItem('token');
          const tipo = localStorage.getItem('tipo');
          if (!token || tipo !== 'cliente') {
            this.showNotification('Debes iniciar sesión como cliente para vaciar el carrito', 'error');
            setTimeout(() => window.location.href = tipo === 'admin' ? '/dashboard.html' : '/login.html', 1500);
            return;
          }

          const res = await fetch('/api/cart', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('tipo');
            this.showNotification('Sesión inválida. Por favor, inicia sesión nuevamente.', 'error');
            setTimeout(() => window.location.href = '/login.html', 1500);
            return;
          }

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            // Muestra el mensaje real del backend en la notificación
            this.showNotification(errorData.message || `Error: ${res.status}`, 'error');
            throw new Error(`Failed to clear cart: ${res.status} - ${errorData.message || 'Unknown error'}`);
          }

          console.log('Cart cleared');
          this.clearCartWithAnimation();
          this.showNotification('Carrito vaciado exitosamente', 'success');
        } catch (err) {
          console.error('Clear Cart Error:', err);
          this.showNotification('Error al vaciar el carrito', 'error');
        }
      }
    );
  }

  handlePromoCode(e) {
    e.preventDefault();

    if (this.isLoading) return;

    const promoInput = document.getElementById('promoCode');
    const promoBtn = e.target.querySelector('button[type="submit"]');
    const promoCode = promoInput.value.trim();

    if (!promoCode) {
      this.showPromoMessage('Por favor ingresa un código de descuento', 'error');
      return;
    }

    this.setLoadingState(promoBtn, true);

    setTimeout(() => {
      this.setLoadingState(promoBtn, false);
      this.showPromoMessage('Código aplicado exitosamente', 'success');
      promoInput.value = '';
    }, 1500);
  }

  showPromoMessage(message, type) {
    const promoMessage = document.getElementById('promoMessage');
    if (promoMessage) {
      promoMessage.textContent = message;
      promoMessage.className = `promo-message ${type}`;

      setTimeout(() => {
        promoMessage.className = 'promo-message';
        promoMessage.textContent = '';
      }, 5000);
    }
  }

  handleCheckout() {
    const cartItems = document.querySelectorAll('.cart-item');
    if (cartItems.length === 0) {
      this.showNotification('No hay productos en el carrito', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    const tipo = localStorage.getItem('tipo');
    if (!token || tipo !== 'cliente') {
      this.showNotification('Debes iniciar sesión como cliente para comprar', 'error');
      setTimeout(() => window.location.href = tipo === 'admin' ? '/dashboard.html' : '/login.html', 1500);
      return;
    }
    this.showLoadingOverlay(); // Mostrar overlay de carga

    // Aquí podrías recolectar id_direccion_facturacion si tuvieras un selector en el HTML
    // const idDireccionFacturacion = document.getElementById('direccionSelect')?.value;
    // const bodyData = idDireccionFacturacion ? { id_direccion_facturacion: idDireccionFacturacion } : {};

    // Construir el array de items para enviar al backend
    const itemsParaPedido = this.cartItems.map(item => {
      const detallesVuelo = item.detalles_vuelo_json ? JSON.parse(item.detalles_vuelo_json) : {};
      return {
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        // Incluir detalles adicionales si existen, asegurándose de que los nombres coincidan con lo que espera el backend
        seleccion_clase_servicio_id: detallesVuelo.seleccion_clase_servicio_id !== undefined ? detallesVuelo.seleccion_clase_servicio_id : null,
        seleccion_asiento_fisico_id: detallesVuelo.seleccion_asiento_fisico_id !== undefined ? detallesVuelo.seleccion_asiento_fisico_id : null,
        selecciones_equipaje: Array.isArray(detallesVuelo.selecciones_equipaje) ? detallesVuelo.selecciones_equipaje : []
      };
    });

    const bodyData = {
      // id_direccion_facturacion: idDireccionFacturacion ? Number(idDireccionFacturacion) : undefined, // Descomentar si se implementa selector de dirección
      items: itemsParaPedido
    };

    fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    })
    .then(res => {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('tipo');
        this.showNotification('Sesión inválida. Por favor, inicia sesión nuevamente.', 'error');
        setTimeout(() => window.location.href = '/login.html', 1500);
        throw new Error('Unauthorized'); // Para detener la ejecución
      }
      if (res.status === 403) { // Email no verificado
         this.showNotification('Debes verificar tu email para crear un pedido.', 'error');
         showEmailVerificationOverlay(); // Mostrar el overlay específico
         throw new Error('Email not verified');
      }
      return res.json().then(data => {
        if (!res.ok) {
          // Arrojar un error con el mensaje del backend si está disponible
          throw new Error(data.message || `Error ${res.status} al crear el pedido`);
        }
        return data; // Pedido creado
      });
    })
    .then(pedidoCreado => {
      if (pedidoCreado && pedidoCreado.id_pedido) {
        this.showNotification('Pedido creado exitosamente. Redirigiendo al pago...', 'success');
        // Vaciar el carrito localmente (la API ya lo hace en la BD)
        this.cartItems = [];
        this.renderCartItems([]); 
        this.updateCartTotals();
        
        // Construir la URL para pagos.html
        const params = new URLSearchParams({
            pedidoId: pedidoCreado.id_pedido.toString(), // Asegurar que es string
            // total: pedidoCreado.total // El total se obtendrá del pedido en pagos.js, es más fiable
        });
        // Log para depuración
        console.log(`INFO: carrito.js - Redirigiendo a pagos.html con params: ${params.toString()}`);
        window.location.href = `pagos.html?${params.toString()}`;

      } else {
        // Esto no debería ocurrir si la respuesta fue OK y tenía datos
        console.error('ERROR: carrito.js - Respuesta de creación de pedido inválida o falta ID de pedido. Respuesta:', pedidoCreado);
        throw new Error('Respuesta de creación de pedido inválida o falta ID de pedido.');
      }
    })
    .catch(err => {
      if (err.message !== 'Unauthorized' && err.message !== 'Email not verified') { // No mostrar doble notificación
          this.showNotification(err.message || 'Error al procesar la compra.', 'error');
      }
      console.error('Checkout Error:', err);
    })
    .finally(() => {
      this.hideLoadingOverlay(); // Ocultar overlay de carga
    });
  }

  updateCartDisplay() {
    const cartItems = document.querySelectorAll('.cart-item');
    const emptyCart = document.getElementById('emptyCart');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartSummarySection = document.getElementById('cartSummarySection');

    if (cartItems.length === 0) {
      if (emptyCart) emptyCart.style.display = 'block';
      if (cartItemsContainer) cartItemsContainer.style.display = 'none';
      if (cartSummarySection) cartSummarySection.style.display = 'none';
    } else {
      if (emptyCart) emptyCart.style.display = 'none';
      if (cartItemsContainer) cartItemsContainer.style.display = 'block';
      if (cartSummarySection) cartSummarySection.style.display = 'block';
    }
  }

  setupTemplates() {
    this.cartItemTemplate = document.getElementById('cartItemTemplate');
    this.recommendedItemTemplate = document.getElementById('recommendedItemTemplate');
  }

  setupModalControls() {
    const modal = document.getElementById('confirmationModal');
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');

    if (modalClose) {
      modalClose.addEventListener('click', () => this.hideModal());
    }

    if (modalCancel) {
      modalCancel.addEventListener('click', () => this.hideModal());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal();
        }
      });
    }
  }

  showConfirmationModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalConfirm = document.getElementById('modalConfirm');

    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;

    const newConfirmBtn = modalConfirm.cloneNode(true);
    modalConfirm.parentNode.replaceChild(newConfirmBtn, modalConfirm);

    newConfirmBtn.addEventListener('click', () => {
      onConfirm();
      this.hideModal();
    });

    if (modal) modal.classList.add('show');
  }

  hideModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) modal.classList.remove('show');
  }

  setLoadingState(button, isLoading) {
    if (!button) return;

    this.isLoading = isLoading;

    if (isLoading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  }

  showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('show');
  }

  hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('show');
  }

  showNotification(text, type = 'info', duration = 5000) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icon = this.getNotificationIcon(type);
    notification.innerHTML = `
      <i class="fas fa-${icon}"></i>
      <span>${text}</span>
      <button class="notification-close" aria-label="Cerrar mensaje">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(notification);

    setTimeout(() => {
      this.closeNotification(notification);
    }, duration);
  }

  closeNotification(notification) {
    if (notification && notification.parentNode) {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) notification.remove();
      }, 300);
    }
  }

  getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle',
    };
    return icons[type] || 'info-circle';
  }

  setupFormValidation() {
    const promoInput = document.getElementById('promoCode');
    if (promoInput) {
      promoInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value.length > 0) {
          e.target.style.borderColor = 'var(--primary-color)';
        } else {
          e.target.style.borderColor = '';
        }
      });
    }
  }

  setupAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animationDelay = `${Math.random() * 0.3}s`;
          entry.target.classList.add('animate-in');
        }
      });
    });

    document.querySelectorAll('.cart-item, .cart-summary, .recommended-section').forEach((el) => {
      observer.observe(el);
    });
  }

  handleKeyboardShortcuts(e) {
    if (e.key === 'Escape') {
      this.hideModal();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const cartItems = document.querySelectorAll('.cart-item');
      if (cartItems.length > 0) {
        this.handleCheckout();
      }
    }
  }

  async refreshCart() {
    try {
      const token = localStorage.getItem('token');
      const tipo = localStorage.getItem('tipo');
      if (!token || tipo !== 'cliente') {
        this.showNotification('Debes iniciar sesión como cliente para actualizar el carrito', 'error');
        setTimeout(() => window.location.href = tipo === 'admin' ? '/dashboard.html' : '/login.html', 1500);
        return;
      }

      const res = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('tipo');
        this.showNotification('Sesión inválida. Por favor, inicia sesión nuevamente.', 'error');
        setTimeout(() => window.location.href = '/login.html', 1500);
        return;
      }

      if (res.status === 403) {
        let errorMessage = 'Debes verificar tu email para ver el carrito';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        if (errorMessage.includes('verificar tu email')) {
          hideAccessOverlay();
          showEmailVerificationOverlay();
          return;
        }
        this.showNotification(errorMessage, 'error');
        hideAccessOverlay();
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to fetch cart: ${res.status} - ${errorData.message || 'Unknown error'}`);
      }

      const items = await res.json();
      console.log('Refreshed cart items:', JSON.stringify(items, null, 2));
      this.cartItems = items;
      this.renderCartItems(items);
      this.updateCartDisplay();
      this.updateCartTotals();
    } catch (err) {
      console.error('Refresh Cart Error:', err);
      this.showNotification('Error al actualizar el carrito', 'error');
    }
  }

  renderCartItems(items) {
    const cartItemsList = document.getElementById('cartItemsList');
    let total = 0;
    let invalidItemDetails = [];
    cartItemsList.innerHTML = '';

    if (!Array.isArray(items) || items.length === 0) {
      document.getElementById('emptyCart').style.display = 'block';
      document.getElementById('cartItemsContainer').style.display = 'none';
      return;
    }

    document.getElementById('emptyCart').style.display = 'none';
    document.getElementById('cartItemsContainer').style.display = 'block';

    items.forEach((item) => {
      let validationErrors = [];
      if (!item) validationErrors.push('Item is null or undefined');
      if (!item.id_item) validationErrors.push('Missing id_item');
      if (!item.producto) validationErrors.push('Missing producto');
      if (item.producto && !item.producto.id_producto) validationErrors.push('Missing producto.id_producto');
      if (item.producto && !item.producto.nombre) validationErrors.push('Missing producto.nombre');
      if (item.producto && typeof item.producto.precio === 'undefined') validationErrors.push('Missing producto.precio');
      if (typeof item.cantidad !== 'number') validationErrors.push(`Invalid cantidad: ${item.cantidad}`);

      if (validationErrors.length > 0) {
        console.warn('Invalid cart item:', { item, errors: validationErrors });
        invalidItemDetails.push(`Item ${item?.id_item || 'unknown'}: ${validationErrors.join(', ')}`);
        return;
      }

      // --- NUEVO: Mostrar detalles de vuelo enriquecidos si existen ---
      let detallesVueloHTML = '';
      if (item.producto.tipoProducto?.nombre?.toLowerCase() === 'vuelo') {
        if (item.detalles_vuelo_populados && Object.keys(item.detalles_vuelo_populados).length > 0) {
          detallesVueloHTML += '<div class="vuelo-detalles-extra">';
          if (item.detalles_vuelo_populados.nombre_clase_servicio) {
            detallesVueloHTML += `<div><b>Clase seleccionada:</b> ${item.detalles_vuelo_populados.nombre_clase_servicio}</div>`;
          }
          if (item.detalles_vuelo_populados.info_asiento_seleccionado) {
            detallesVueloHTML += `<div><b>Asiento seleccionado:</b> ${item.detalles_vuelo_populados.info_asiento_seleccionado}</div>`;
          }
          if (Array.isArray(item.detalles_vuelo_populados.info_equipaje_seleccionado) && item.detalles_vuelo_populados.info_equipaje_seleccionado.length > 0) {
            detallesVueloHTML += `<div><b>Equipaje:</b> ` + item.detalles_vuelo_populados.info_equipaje_seleccionado.map(eq => `${eq.nombre ? eq.nombre : 'ID desconocido'} (x${eq.cantidad})`).join(', ') + '</div>';
          }
          detallesVueloHTML += '</div>';
        } else if (item.detalles_vuelo_json) {
          // Fallback: mostrar los IDs si no hay datos enriquecidos
          try {
            const detalles = JSON.parse(item.detalles_vuelo_json);
            detallesVueloHTML += '<div class="vuelo-detalles-extra">';
            if (detalles.seleccion_clase_servicio_id) {
              detallesVueloHTML += `<div><b>Clase seleccionada:</b> ID ${detalles.seleccion_clase_servicio_id}</div>`;
            }
            if (detalles.seleccion_asiento_fisico_id) {
              detallesVueloHTML += `<div><b>Asiento seleccionado:</b> ID ${detalles.seleccion_asiento_fisico_id}</div>`;
            }
            if (Array.isArray(detalles.selecciones_equipaje) && detalles.selecciones_equipaje.length > 0) {
              detallesVueloHTML += `<div><b>Equipaje:</b> ` + detalles.selecciones_equipaje.map(eq => `ID ${eq.id_opcion_equipaje} (x${eq.cantidad})`).join(', ') + '</div>';
            }
            detallesVueloHTML += '</div>';
          } catch (e) {
            detallesVueloHTML = '<div style="color:#c00;font-size:0.95em;">Error al leer detalles de vuelo</div>';
          }
        }
      }
      // --- FIN NUEVO ---

      // Usar precio_total_item_calculado si está disponible
      const precioUnitario = (typeof item.precio_total_item_calculado === 'number' && item.cantidad > 0)
        ? (item.precio_total_item_calculado / item.cantidad)
        : parseFloat(item.producto.precio);
      const totalItem = (typeof item.precio_total_item_calculado === 'number')
        ? item.precio_total_item_calculado
        : precioUnitario * item.cantidad;

      const div = document.createElement('div');
      div.className = 'cart-item';
      div.dataset.itemId = item.id_item;
      div.dataset.itemType = item.producto.tipoProducto?.nombre?.toLowerCase() || 'unknown';
      div.innerHTML = `
        <div>
          <span class="item-title">${item.producto.nombre}</span>
          <span class="item-type-badge">${item.producto.tipoProducto?.nombre || 'N/A'}</span>
          ${detallesVueloHTML}
        </div>
        <div>
          <span>Cantidad: 
            <button class="quantity-btn decrease" data-item-id="${item.id_item}">-</button>
            <input type="number" class="quantity-input" data-item-id="${item.id_item}" value="${item.cantidad}" min="1" max="10">
            <button class="quantity-btn increase" data-item-id="${item.id_item}">+</button>
          </span>
          <span>Precio unitario: <span class="unit-price-amount">$${precioUnitario.toFixed(2)}</span></span>
          <span>Total: <span class="total-price-amount">$${totalItem.toFixed(2)}</span></span>
          <button class="remove-item-btn" data-item-id="${item.id_item}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      total += totalItem;
      cartItemsList.appendChild(div);
    });

    if (invalidItemDetails.length > 0) {
      this.showNotification(
        `Algunos elementos del carrito no se pudieron cargar: ${invalidItemDetails.join('; ')}.`,
        'warning',
        10000
      );
    }
    document.getElementById('totalAmount').textContent = `$${total.toFixed(2)}`;
  }

  addItemToCart(itemData) {
    this.showNotification('Producto agregado al carrito', 'success');
    this.refreshCart();
  }
}

// Overlay para email no verificado
function showEmailVerificationOverlay() {
  let overlay = document.getElementById('emailVerificationOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'emailVerificationOverlay';
    overlay.style.position = 'fixed';
    overlay.style.zIndex = '10000';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(255,255,255,0.98)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.innerHTML = `
      <div style="background:#fff;padding:2.5rem 2rem 2rem 2rem;border-radius:1rem;box-shadow:0 2px 24px #0002;max-width:400px;text-align:center;">
        <i class="fas fa-envelope-open-text" style="font-size:2.5rem;color:#007bff;"></i>
        <h2 style="margin:1rem 0 0.5rem 0;">Verifica tu email</h2>
        <p style="color:#444;">Debes verificar tu email para acceder al carrito y finalizar tu compra.</p>
        <button id="resendVerificationBtn" class="btn btn-primary" style="margin:1rem 0 0.5rem 0;width:100%;"><i class="fas fa-paper-plane"></i> Reenviar email de verificación</button>
        <a href="verificar-email.html" class="btn btn-secondary" style="width:100%;display:inline-block;">Ya verifiqué mi email</a>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
  // Oculta el contenido principal
  document.querySelector('main')?.classList.add('blurred');
  // Evento para reenviar email
  document.getElementById('resendVerificationBtn').onclick = async function() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        window.CartAPI.showNotification('Email de verificación reenviado. Revisa tu bandeja de entrada.', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        window.CartAPI.showNotification(data.message || 'No se pudo reenviar el email.', 'error');
      }
    } catch (err) {
      window.CartAPI.showNotification('Error al reenviar el email.', 'error');
    }
  };
}

let cartUI;

document.addEventListener('DOMContentLoaded', async function () {
  const hideAccessOverlay = () => {
    const accessOverlay = document.getElementById('accessOverlay');
    if (accessOverlay) accessOverlay.style.display = 'none';
  };

  const token = localStorage.getItem('token');
  const tipo = localStorage.getItem('tipo');
  console.log('Token found:', token ? `Yes (${token.substring(0, 10)}...)` : 'No');
  console.log('Tipo:', tipo);

  if (!token) {
    console.log('No token, redirecting to login.html');
    hideAccessOverlay();
    window.CartAPI.showNotification('Debes iniciar sesión para acceder al carrito', 'error');
    setTimeout(() => window.location.href = 'login.html', 3000);
    return;
  }

  if (tipo !== 'cliente') {
    console.log('Invalid user type, redirecting to:', tipo === 'admin' ? 'dashboard.html' : 'index.html');
    hideAccessOverlay();
    window.CartAPI.showNotification('Solo los clientes pueden acceder al carrito', 'error');
    setTimeout(() => window.location.href = tipo === 'admin' ? '/dashboard.html' : '/index.html', 3000);
    return;
  }

  try {
    console.log('Fetching cart with token:', token.substring(0, 10) + '...');
    const res = await fetch('/api/cart', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Cart API Response Status:', res.status);

    if (res.status === 401) {
      console.log('Unauthorized, redirecting to login.html');
      localStorage.removeItem('token');
      localStorage.removeItem('tipo');
      hideAccessOverlay();
      window.CartAPI.showNotification('Sesión inválida. Por favor, inicia sesión nuevamente.', 'error');
      setTimeout(() => window.location.href = 'login.html', 3000);
      return;
    }

    if (res.status === 403) {
      let errorMessage = 'Debes verificar tu email para ver el carrito';
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorMessage;
      } catch {}
      if (errorMessage.includes('verificar tu email')) {
        hideAccessOverlay();
        showEmailVerificationOverlay();
        return;
      }
      window.CartAPI.showNotification(errorMessage, 'error');
      hideAccessOverlay();
      return;
    }

    if (!res.ok) {
      let errorMessage = 'Error al cargar el carrito';
      try {
        const errorData = await res.json();
        console.log('Cart API Error Response:', errorData);
        errorMessage = errorData.message || `Error ${res.status}`;
      } catch {
        console.log('Failed to parse error response');
      }
      throw new Error(`API Error: ${res.status} - ${errorMessage}`);
    }

    const items = await res.json();
    console.log('Cart Items:', JSON.stringify(items, null, 2));
    cartUI = new CartUI();
    cartUI.cartItems = items;
    cartUI.renderCartItems(items);
    hideAccessOverlay();
  } catch (err) {
    console.error('Cart Load Error:', err.message);
    hideAccessOverlay();
    window.CartAPI.showNotification(`Error al cargar el carrito: ${err.message}. Por favor, intenta de nuevo.`, 'error');
  }
});

// Eliminar el event listener redundante para confirmarCompraBtn
// document.getElementById('confirmarCompraBtn')?.addEventListener('click', async function () {
// ... (código eliminado) ...
// });

window.CartAPI = {
  showNotification: function (text, type, duration) {
    if (cartUI) cartUI.showNotification(text, type, duration);
    else {
      console.log('Notification:', text, type);
      alert(text);
    }
  },
  refreshCart: function () {
    if (cartUI) cartUI.refreshCart();
  },
  addItemToCart: function (itemData) {
    if (cartUI) cartUI.addItemToCart(itemData);
  },
  updateCartCount: function () {
    if (cartUI) cartUI.updateCartCount();
  },
};