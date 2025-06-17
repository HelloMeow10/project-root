class CheckoutManager {
  constructor() {
    this.orderData = {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    };

    this.formValidation = {
      personal: false,
      payment: false,
      terms: false,
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupFormValidation();
    this.loadOrderSummary();
  }

  setupEventListeners() {
    const purchaseBtn = document.getElementById("completePurchaseBtn");
    if (purchaseBtn) {
      purchaseBtn.addEventListener("click", (e) => this.handlePurchase(e));
    }

    const termsCheckbox = document.getElementById("acceptTerms");
    if (termsCheckbox) {
      termsCheckbox.addEventListener("change", (e) => this.validateTerms(e.target.checked));
    }
  }

  async loadOrderSummary() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    const orderItemsContainer = document.getElementById("orderItems");
    try {
      const res = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }
      const items = await res.json();
      if (!Array.isArray(items) || !items.length) {
        alert('No hay productos en el carrito');
        window.location.href = 'carrito.html';
        return;
      }
      orderItemsContainer.innerHTML = ''; // Clear loading placeholder
      this.displayOrderSummary(items);
    } catch (e) {
      console.error('Load Order Summary Error:', e);
      alert('Error al cargar el carrito. Por favor, intenta de nuevo.');
      orderItemsContainer.innerHTML = '<p>Error al cargar el resumen del pedido.</p>';
    }
  }

  displayOrderSummary(items) {
    const orderItemsContainer = document.getElementById("orderItems");
    let subtotal = 0;

    orderItemsContainer.innerHTML = items.map(item => {
      const producto = item.producto;
      const cantidad = item.cantidad;
      const itemTotal = Number(producto.precio) * cantidad;
      subtotal += itemTotal;
      return `
        <div class="order-item">
          <div class="item-name">${producto.nombre}</div>
          <div class="item-qty">x${cantidad}</div>
          <div class="item-price">$${itemTotal.toFixed(2)}</div>
        </div>
      `;
    }).join("");

    const tax = subtotal * 0.21;
    const total = subtotal + tax;

    document.getElementById("subtotalAmount").textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById("taxAmount").textContent = `$${tax.toFixed(2)}`;
    document.getElementById("totalAmount").textContent = `$${total.toFixed(2)}`;
    document.getElementById("btnAmount").textContent = `$${total.toFixed(2)}`;

    this.orderData = { items, subtotal, tax, total };
  }

  setupFormValidation() {
    const personalInputs = document.querySelectorAll("#personalForm input, #personalForm select");
    personalInputs.forEach((input) => {
      input.addEventListener("blur", () => this.validatePersonalField(input));
      input.addEventListener("input", () => this.clearError(input));
    });

    const paymentInputs = document.querySelectorAll("#paymentForm input");
    paymentInputs.forEach((input) => {
      input.addEventListener("blur", () => this.validatePaymentField(input));
      input.addEventListener("input", () => this.clearError(input));
    });

    const cardNumberInput = document.getElementById("cardNumber");
    if (cardNumberInput) {
      cardNumberInput.addEventListener("input", (e) => this.formatCardNumber(e.target));
    }

    const expiryDateInput = document.getElementById("expiryDate");
    if (expiryDateInput) {
      expiryDateInput.addEventListener("input", (e) => this.formatExpiryDate(e.target));
    }

    const cvvInput = document.getElementById("cvv");
    if (cvvInput) {
      cvvInput.addEventListener("input", (e) => this.formatCVV(e.target));
    }
  }

  validatePersonalField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = "";

    switch (fieldName) {
      case "firstName":
      case "lastName":
        if (!value) {
          isValid = false;
          errorMessage = "Este campo es obligatorio";
        } else if (value.length < 2) {
          isValid = false;
          errorMessage = "Debe tener al menos 2 caracteres";
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          isValid = false;
          errorMessage = "Este campo es obligatorio";
        } else if (!emailRegex.test(value)) {
          isValid = false;
          errorMessage = "Ingresa un correo electrónico válido";
        }
        break;
      case "phone":
        const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
        if (!value) {
          isValid = false;
          errorMessage = "Este campo es obligatorio";
        } else if (!phoneRegex.test(value.replace(/\s/g, ""))) {
          isValid = false;
          errorMessage = "Ingresa un número de teléfono válido";
        }
        break;
      case "address":
      case "city":
        if (!value) {
          isValid = false;
          errorMessage = "Este campo es obligatorio";
        } else if (value.length < 3) {
          isValid = false;
          errorMessage = "Debe tener al menos 3 caracteres";
        }
        break;
      case "country":
        if (!value) {
          isValid = false;
          errorMessage = "Selecciona un país";
        }
        break;
    }

    this.showFieldError(field, isValid, errorMessage);
    this.updateFormValidation();
    return isValid;
  }

  validatePaymentField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = "";

    switch (fieldName) {
      case "cardNumber":
        const cardNumber = value.replace(/\s/g, "");
        if (!cardNumber) {
          isValid = false;
          errorMessage = "Este campo es obligatorio";
        } else if (cardNumber.length < 13 || cardNumber.length > 19) {
          isValid = false;
          errorMessage = "Número de tarjeta inválido";
        } else if (!this.validateCardNumber(cardNumber)) {
          isValid = false;
          errorMessage = "Número de tarjeta inválido";
        }
        break;
      case "cardName":
        if (!value) {
          isValid = false;
          errorMessage = "Este campo es obligatorio";
        } else if (value.length < 3) {
          isValid = false;
          errorMessage = "Debe tener al menos 3 caracteres";
        }
        break;
      case "expiryDate":
        const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!value) {
          isValid = false;
          errorMessage = "Este campo es obligatorio";
        } else if (!expiryRegex.test(value)) {
          isValid = false;
          errorMessage = "Formato inválido (MM/AA)";
        } else if (this.isExpired(value)) {
          isValid = false;
          errorMessage = "La tarjeta está vencida";
        }
        break;
      case "cvv":
        if (!value) {
          isValid = false;
          errorMessage = "Este campo es obligatorio";
        } else if (value.length < 3 || value.length > 4) {
          isValid = false;
          errorMessage = "CVV inválido";
        }
        break;
    }

    this.showFieldError(field, isValid, errorMessage);
    this.updateFormValidation();
    return isValid;
  }

  showFieldError(field, isValid, errorMessage) {
    const errorElement = document.getElementById(field.name + "Error");
    if (isValid) {
      field.classList.remove("error");
      if (errorElement) {
        errorElement.classList.remove("show");
        errorElement.textContent = "";
      }
    } else {
      field.classList.add("error");
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.classList.add("show");
      }
    }
  }

  clearError(field) {
    field.classList.remove("error");
    const errorElement = document.getElementById(field.name + "Error");
    if (errorElement) {
      errorElement.classList.remove("show");
      errorElement.textContent = "";
    }
  }

  formatCardNumber(input) {
    const value = input.value.replace(/\s/g, "").replace(/[^0-9]/gi, "");
    const formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
    input.value = formattedValue;
  }

  formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4);
    }
    input.value = value;
  }

  formatCVV(input) {
    input.value = input.value.replace(/[^0-9]/g, "").substring(0, 4);
  }

  validateCardNumber(cardNumber) {
    let sum = 0;
    let shouldDouble = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = Number.parseInt(cardNumber.charAt(i));
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  isExpired(expiryDate) {
    const [month, year] = expiryDate.split("/");
    const expiry = new Date(2000 + Number.parseInt(year), Number.parseInt(month) - 1);
    const now = new Date();
    return expiry < now;
  }

  validateTerms(accepted) {
    this.formValidation.terms = accepted;
    this.updateFormValidation();
  }

  updateFormValidation() {
    const personalForm = document.getElementById("personalForm");
    const personalInputs = personalForm.querySelectorAll("input[required], select[required]");
    this.formValidation.personal = Array.from(personalInputs).every(
      (input) => input.value.trim() !== "" && !input.classList.contains("error")
    );

    const paymentForm = document.getElementById("paymentForm");
    const paymentInputs = paymentForm.querySelectorAll("input[required]");
    this.formValidation.payment = Array.from(paymentInputs).every(
      (input) => input.value.trim() !== "" && !input.classList.contains("error")
    );

    const purchaseBtn = document.getElementById("completePurchaseBtn");
    if (purchaseBtn) {
      purchaseBtn.disabled = !(this.formValidation.personal && this.formValidation.payment && this.formValidation.terms);
    }
  }

  async handlePurchase(e) {
    e.preventDefault();
    const btn = document.getElementById("completePurchaseBtn");
    const btnText = document.getElementById("btnText");
    btnText.innerHTML = '<span class="loading"></span> Procesando...';
    btn.disabled = true;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Debes iniciar sesión');

      // 1. Obtener los items del carrito
      const resCart = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cartItems = await resCart.json();
      if (!Array.isArray(cartItems) || !cartItems.length) throw new Error('El carrito está vacío.');

      // 2. Crear el pedido si no existe uno pendiente
      let pedidoPendiente;
      const resPedidos = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pedidos = await resPedidos.json();
      pedidoPendiente = Array.isArray(pedidos)
        ? pedidos.find(p => p.estado === 'pendiente')
        : null;

      if (!pedidoPendiente) {
        // Crear pedido con los items del carrito
        const resPedido = await fetch('/api/products/pedidos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            items: cartItems.map(item => ({
              id_producto: item.producto.id_producto,
              cantidad: item.cantidad
            }))
          })
        });
        const pedidoData = await resPedido.json();
        if (!resPedido.ok) throw new Error(pedidoData.message || 'No se pudo crear el pedido');
        pedidoPendiente = { id_pedido: pedidoData.id, total: this.orderData.total };
      }

      const pedidoId = pedidoPendiente.id_pedido;
      const monto = Number(pedidoPendiente.total);

      // 3. Llamar al endpoint de pagos
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pedidoId, monto })
      });

      const data = await res.json();
      if (res.ok) {
        this.showSuccessModal();
        // Vacía el carrito en el backend
        await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        // Opcional: actualiza el contador de carrito en la UI
        if (window.CartAPI && typeof window.CartAPI.updateCartCount === 'function') {
          window.CartAPI.updateCartCount();
        }
        // Redirige después de un tiempo
        setTimeout(() => {
          window.location.href = 'paquetes.html';
        }, 2500);
      } else {
        this.showNotification(data.message || 'Error al procesar el pago', 'error');
      }
    } catch (error) {
      this.showNotification(error.message || 'Error de red', 'error');
    } finally {
      btn.disabled = false;
      btnText.innerHTML = 'Finalizar compra';
    }
  }

  showSuccessModal() {
    const modal = document.getElementById("successModal");
    if (modal) {
      modal.classList.add("show");
      document.body.style.overflow = "hidden";
    }
  }

  showNotification(text, type = 'info', duration = 5000) {
    let container = document.getElementById('notificationContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
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

    notification.querySelector('.notification-close').onclick = () => this.closeNotification(notification);
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
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CheckoutManager();
});