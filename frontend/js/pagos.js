class CheckoutManager {
  constructor() {
    this.orderData = {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    };

    this.originalUserData = null;
    
    this.savedBillingAddresses = [];
    this.selectedBillingAddressOption = 'sameAsPersonal';
    this.selectedBillingAddressId = null;

    // Payment Methods (No longer Stripe specific)
    this.savedPaymentMethods = []; // This will be re-evaluated in backend changes
    this.selectedPaymentMethodId = null; // Will refer to a local ID if we implement custom save
    this.useNewPaymentMethod = true;

    this.formValidation = {
      personal: false,
      billingAddress: true,
      payment: false,
      terms: false,
    };

    this.init();
  }

  async init() {
    await this.loadUserData();
    this.setupEventListeners();
    this.setupFormValidation();
    this.loadOrderDetailsFromURL(); // Reemplaza a loadOrderSummary y carga datos del pedido
    await this.loadUserData(); // Cargar datos de usuario para pre-rellenar y obtener direcciones
    this.loadSavedBillingAddresses(); // Cargar direcciones de facturación guardadas
    this.loadSavedPaymentMethods(); // Lógica actual (mayormente deshabilitada)
  }

  async loadOrderDetailsFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const pedidoId = urlParams.get('pedidoId');
    // const totalFromCart = urlParams.get('total'); // Total de la URL es menos fiable, preferir el del pedido

    const orderItemsContainer = document.getElementById("orderItems");
    const loadingPlaceholder = orderItemsContainer?.querySelector('.loading-placeholder');
    const totalAmountEl = document.getElementById("totalAmount");
    const btnAmountEl = document.getElementById("btnAmount");
    const subtotalAmountEl = document.getElementById("subtotalAmount");
    const taxAmountEl = document.getElementById("taxAmount");

    if (!pedidoId) {
      this.showNotification('ID de pedido no encontrado. Redirigiendo al carrito...', 'error', 5000);
      setTimeout(() => window.location.href = 'carrito.html', 2500);
      return;
    }
    this.orderData.pedidoId = parseInt(pedidoId); // Guardar el ID del pedido

    if (loadingPlaceholder) loadingPlaceholder.style.display = 'block';
    if (orderItemsContainer) orderItemsContainer.innerHTML = ''; // Limpiar por si acaso

    const token = localStorage.getItem('token');
    if (!token) {
        this.showNotification('Sesión no encontrada. Redirigiendo al login...', 'error', 5000);
        setTimeout(() => window.location.href = 'login.html', 2500);
        return;
    }

    try {
        const response = await fetch(`/api/orders/${pedidoId}`, { // Usar el endpoint getOrderById
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Error ${response.status} al cargar el pedido ${pedidoId}`);
        }
        const pedido = await response.json();
        console.log("Pedido cargado:", pedido);

        if (loadingPlaceholder) loadingPlaceholder.style.display = 'none';
        
        this.orderData.items = pedido.items.map(item => ({ // Asumiendo que 'items' viene con 'producto' anidado
            id_producto: item.producto.id_producto,
            nombre: item.producto.nombre,
            cantidad: item.cantidad,
            precio: parseFloat(item.precio) // precio del PedidoItem
        }));

        let subtotalCalculado = 0;
        if (orderItemsContainer) {
            orderItemsContainer.innerHTML = this.orderData.items.map(item => {
                const itemTotal = item.precio * item.cantidad;
                subtotalCalculado += itemTotal;
                return `
                  <div class="order-item">
                    <div class="item-name">${item.nombre}</div>
                    <div class="item-qty">x${item.cantidad}</div>
                    <div class="item-price">$${itemTotal.toFixed(2)}</div>
                  </div>
                `;
            }).join("");
        }
        
        const totalPedidoBackend = parseFloat(pedido.total);
        this.orderData.total = totalPedidoBackend;
        
        // Asumimos que el total del pedido ya incluye impuestos si aplica.
        // Para el desglose, si el subtotal no viene del backend, lo calculamos.
        this.orderData.subtotal = subtotalCalculado; 
        this.orderData.tax = totalPedidoBackend - subtotalCalculado; 
        
        if (this.orderData.tax < 0) this.orderData.tax = 0; // Evitar impuestos negativos

        if (subtotalAmountEl) subtotalAmountEl.textContent = `$${this.orderData.subtotal.toFixed(2)}`;
        if (taxAmountEl) taxAmountEl.textContent = `$${this.orderData.tax.toFixed(2)}`;
        if (totalAmountEl) totalAmountEl.textContent = `$${this.orderData.total.toFixed(2)}`;
        if (btnAmountEl) btnAmountEl.textContent = `$${this.orderData.total.toFixed(2)}`;

    } catch (e) {
        console.error('Load Order Details Error:', e);
        this.showNotification('Error al cargar los detalles del pedido: ' + e.message, 'error', 5000);
        if (loadingPlaceholder) loadingPlaceholder.style.display = 'none';
        if (orderItemsContainer) orderItemsContainer.innerHTML = '<p>Error al cargar el resumen del pedido.</p>';
    }
  }


  // Stripe initializeStripeElements() removed

  async loadSavedPaymentMethods() {
    // This functionality is temporarily disabled as we are removing Stripe.
    // A custom solution for saving payment methods would require significant backend changes
    // and careful consideration of PCI DSS compliance if handling raw card data.
    console.warn("loadSavedPaymentMethods: Stripe integration removed. Saved payment methods (Stripe-based) are disabled.");
    const selectElement = document.getElementById('selectSavedPaymentMethod');
    const savedMethodsContainer = document.getElementById('savedPaymentMethodsContainer');
    const deleteBtn = document.getElementById('deletePaymentMethodBtn');
    const useNewLink = document.getElementById('useNewPaymentMethodLink');

    if (selectElement) {
        selectElement.innerHTML = '<option value="">No hay métodos de pago guardados</option>';
        selectElement.disabled = true;
    }
    if (savedMethodsContainer) {
        // Hide the entire section for saved payment methods for now
        savedMethodsContainer.style.display = 'none';
    }
    if (deleteBtn) {
        deleteBtn.style.display = 'none';
    }
    if (useNewLink) {
        // Hide the link to use new payment method if the saved section is hidden
        useNewLink.style.display = 'none';
    }

    this.useNewPaymentMethod = true; // Always force new payment method for now
    this.togglePaymentMethodForm();
  }

  togglePaymentMethodForm() {
    const paymentForm = document.getElementById('paymentForm');
    // Saved methods container is hidden by loadSavedPaymentMethods, so no need to manage its display here.
    if (this.useNewPaymentMethod) {
        if (paymentForm) paymentForm.style.display = 'block';
        this.selectedPaymentMethodId = null;
        const selectSaved = document.getElementById('selectSavedPaymentMethod');
        if(selectSaved) selectSaved.value = ""; // Ensure it's cleared
    } else {
        // This case should ideally not be reached if saved methods are disabled
        if (paymentForm) paymentForm.style.display = 'none';
    }
    this.updateFormValidation();
  }

  async loadUserData() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Usuario no autenticado, no se cargarán datos personales.');
      return;
    }

    try {
      const response = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        console.error('Error al cargar datos del usuario:', response.status, await response.text());
        return;
      }

      const userData = await response.json();
      this.originalUserData = { ...userData }; // Guardar datos originales

      const firstNameInput = document.getElementById('firstName');
      const lastNameInput = document.getElementById('lastName');
      const emailInput = document.getElementById('email');
      const phoneInput = document.getElementById('phone');
      const addressInput = document.getElementById('address');
      const dniInput = document.getElementById('dni'); // Nuevo campo DNI

      if (firstNameInput && userData.nombre) {
        firstNameInput.value = userData.nombre;
        firstNameInput.disabled = true;
        this.validatePersonalField(firstNameInput);
      }

      if (lastNameInput && userData.apellido) {
        lastNameInput.value = userData.apellido;
        lastNameInput.disabled = true;
      } else if (lastNameInput) {
        lastNameInput.value = ''; // Limpiar si no hay dato pero el campo existe
        lastNameInput.disabled = true;
      }
      // Validar siempre el campo si existe, incluso si no vino el dato y se limpió
      if (lastNameInput) this.validatePersonalField(lastNameInput);


      if (emailInput && userData.email) {
        emailInput.value = userData.email;
        emailInput.disabled = true;
        this.validatePersonalField(emailInput);
      }

      if (phoneInput) {
        if (userData.telefono) { // Si hay un número de teléfono en los datos del usuario
            phoneInput.value = userData.telefono;
            phoneInput.disabled = true;
        } else { // No hay número de teléfono, o es una cadena vacía
            phoneInput.value = ''; // Asegurar que esté vacío si no hay dato
            phoneInput.disabled = false; // El campo permanece editable
        }
        this.validatePersonalField(phoneInput); // Validar el campo después de modificarlo
      }

      if (addressInput) {
        if (userData.direccion) { // Si hay una dirección en los datos del usuario
            addressInput.value = userData.direccion;
            addressInput.disabled = true;
        } else { // No hay dirección, o es una cadena vacía
            addressInput.value = ''; // Asegurar que esté vacío si no hay dato
            addressInput.disabled = false; // El campo permanece editable
        }
        this.validatePersonalField(addressInput); // Validar el campo después de modificarlo
      }

      if (dniInput) { // Manejo del campo DNI
        if (userData.dni) {
          dniInput.value = userData.dni;
          dniInput.disabled = true; // Deshabilitar si ya viene del backend y está verificado/es fijo
        } else {
          dniInput.value = '';
          dniInput.disabled = false; // Habilitar si no hay DNI para que el usuario lo ingrese
        }
        this.validatePersonalField(dniInput); // Validar (puede que inicialmente esté vacío y no sea error hasta el blur)
      }
      
      this.updateFormValidation(); // Actualizar estado general del formulario

    } catch (error) {
      console.error('Error en loadUserData:', error);
    }
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

    document.querySelectorAll('input[name="billingAddressOption"]').forEach(radio => {
      radio.addEventListener('change', (e) => this.handleBillingAddressOptionChange(e.target.value));
    });

    const selectSavedBillingAddress = document.getElementById('selectSavedBillingAddress');
    if (selectSavedBillingAddress) {
        selectSavedBillingAddress.addEventListener('change', (e) => {
            this.selectedBillingAddressId = e.target.value ? parseInt(e.target.value) : null;
            this.updateFormValidation(); // Revalidar cuando se selecciona una dirección guardada
        });
    }

    const selectSavedPaymentMethod = document.getElementById('selectSavedPaymentMethod');
    if (selectSavedPaymentMethod) {
        selectSavedPaymentMethod.addEventListener('change', (e) => {
            this.selectedPaymentMethodId = e.target.value;
            this.useNewPaymentMethod = !e.target.value; // Si se selecciona algo, no es nuevo.
            this.togglePaymentMethodForm();
            const deleteBtn = document.getElementById('deletePaymentMethodBtn');
            if (deleteBtn) deleteBtn.style.display = e.target.value ? 'inline-block' : 'none';
        });
    }

    const useNewPaymentMethodLink = document.getElementById('useNewPaymentMethodLink');
    if (useNewPaymentMethodLink) {
        useNewPaymentMethodLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.useNewPaymentMethod = true;
            this.selectedPaymentMethodId = null;
            if(selectSavedPaymentMethod) selectSavedPaymentMethod.value = ""; // Deseleccionar del select
            const deleteBtn = document.getElementById('deletePaymentMethodBtn');
            if (deleteBtn) deleteBtn.style.display = 'none';
            this.togglePaymentMethodForm();
        });
    }
    
    const deletePaymentMethodBtn = document.getElementById('deletePaymentMethodBtn');
    if (deletePaymentMethodBtn) {
        deletePaymentMethodBtn.addEventListener('click', () => this.handleDeletePaymentMethod());
    }
  }

  async handleDeletePaymentMethod() {
    if (!this.selectedPaymentMethodId) {
        this.showNotification('Por favor, selecciona un método de pago para eliminar.', 'info');
        return;
    }
    
    const confirmed = confirm('¿Estás seguro de que quieres eliminar este método de pago?');
    if (!confirmed) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`/api/payments/metodos-pago/${this.selectedPaymentMethodId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            this.showNotification('Método de pago eliminado correctamente.', 'success');
            this.selectedPaymentMethodId = null;
            await this.loadSavedPaymentMethods(); // Recargar la lista
        } else {
            const errorData = await response.json();
            this.showNotification(`Error al eliminar: ${errorData.message || response.statusText}`, 'error');
        }
    } catch (error) {
        this.showNotification(`Error de red: ${error.message}`, 'error');
    }
  }


  handleBillingAddressOptionChange(option) {
    this.selectedBillingAddressOption = option;
    const billingAddressForm = document.getElementById('billingAddressForm');
    const savedBillingAddressesContainer = document.getElementById('savedBillingAddressesContainer');

    if (option === 'newAddress') {
      billingAddressForm.style.display = 'block';
      savedBillingAddressesContainer.style.display = 'block'; // Mostrar también el selector por si quiere cambiar
      this.selectedBillingAddressId = null; // Deseleccionar cualquier dirección guardada
      document.getElementById('selectSavedBillingAddress').value = "";
    } else if (option === 'sameAsPersonal') {
      billingAddressForm.style.display = 'none';
      savedBillingAddressesContainer.style.display = 'none';
      this.selectedBillingAddressId = null;
    } else if (option === 'savedAddress') { // Esta opción no existe como radio, pero la manejamos si integramos el select directamente
      billingAddressForm.style.display = 'none';
      savedBillingAddressesContainer.style.display = 'block';
    }
    this.updateFormValidation();
  }

  async loadSavedBillingAddresses() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const selectElement = document.getElementById('selectSavedBillingAddress');
    const container = document.getElementById('savedBillingAddressesContainer');

    try {
      const response = await fetch('/api/direcciones-facturacion', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        console.error('Error al cargar direcciones de facturación guardadas');
        if(selectElement) selectElement.innerHTML = '<option value="">Error al cargar</option>';
        return;
      }
      this.savedBillingAddresses = await response.json();
      if (selectElement) {
        if (this.savedBillingAddresses.length > 0) {
          selectElement.innerHTML = '<option value="">Selecciona una dirección guardada</option>';
          this.savedBillingAddresses.forEach(addr => {
            const option = document.createElement('option');
            option.value = addr.id_direccion;
            option.textContent = `${addr.calle} ${addr.numero || ''}, ${addr.ciudad} - ${addr.dni}`;
            selectElement.appendChild(option);
          });
          // Si hay direcciones, ofrecer la opción de usar una guardada por defecto
          // o cambiar el radio button
           if (container) container.style.display = 'block'; // Mostrar si hay direcciones
        } else {
          selectElement.innerHTML = '<option value="">No tienes direcciones guardadas</option>';
          selectElement.disabled = true;
           if (container) container.style.display = 'none'; // Ocultar si no hay
        }
      }
    } catch (error) {
      console.error('Error en loadSavedBillingAddresses:', error);
      if(selectElement) selectElement.innerHTML = '<option value="">Error al cargar</option>';
    }
  }

  /* displayOrderSummary(items) { // Comentado o eliminado ya que la lógica se movió
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

    // Listeners para el formulario de dirección de facturación
    const billingAddressInputs = document.querySelectorAll("#billingAddressForm input, #billingAddressForm select");
    billingAddressInputs.forEach((input) => {
      input.addEventListener("blur", () => this.validateBillingAddressField(input));
      input.addEventListener("input", () => this.clearError(input)); // Reutilizar clearError
    });
  }

  validateBillingAddressField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = "";

    // Solo validar si el formulario de dirección de facturación es visible
    const billingAddressForm = document.getElementById('billingAddressForm');
    if (!billingAddressForm || billingAddressForm.style.display === 'none') {
        this.showFieldError(field, true, ""); // Limpiar errores si el form no está visible
        return true;
    }
    
    switch (fieldName) {
        case "billingDni":
            const dniRegex = /^\d{7,8}$/; // Ejemplo Argentina
            if (!value && field.required) { isValid = false; errorMessage = "Este campo es obligatorio"; }
            else if (value && !dniRegex.test(value)) { isValid = false; errorMessage = "DNI inválido (7-8 dígitos)"; }
            break;
        case "billingStreet":
        case "billingCity":
        case "billingProvince":
            if (!value && field.required) { isValid = false; errorMessage = "Este campo es obligatorio"; }
            else if (value && value.length < 3) { isValid = false; errorMessage = "Debe tener al menos 3 caracteres"; }
            break;
        case "billingZip":
            const zipRegex = /^[A-Za-z0-9\s-]{3,10}$/; // Flexible para varios formatos
            if (!value && field.required) { isValid = false; errorMessage = "Este campo es obligatorio"; }
            else if (value && !zipRegex.test(value)) { isValid = false; errorMessage = "Código postal inválido"; }
            break;
        case "billingCountry":
            if (!value && field.required) { isValid = false; errorMessage = "Selecciona un país"; }
            break;
        case "billingNumber": // Campos no obligatorios, sin validación si están vacíos
        case "billingFloor":
        case "billingApartment":
            break; 
    }
    this.showFieldError(field, isValid, errorMessage);
    this.updateFormValidation(); // Actualizar validación general
    return isValid;
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
      case "dni": // Validación para DNI
        // Ejemplo de validación simple para DNI (Argentina: 7-8 dígitos numéricos)
        // Ajustar regex según el país o tipo de identificación
        const dniRegex = /^\d{7,8}$/; 
        if (!value) {
          isValid = false;
          errorMessage = "Este campo es obligatorio";
        } else if (!dniRegex.test(value)) {
          isValid = false;
          errorMessage = "DNI inválido (debe tener 7-8 dígitos numéricos)";
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

    // Validación para la dirección de facturación
    if (this.selectedBillingAddressOption === 'newAddress') {
      const billingForm = document.getElementById("billingAddressForm");
      const billingInputs = billingForm.querySelectorAll("input[required], select[required]");
      this.formValidation.billingAddress = Array.from(billingInputs).every(
        (input) => input.value.trim() !== "" && !input.classList.contains("error")
      );
    } else if (this.selectedBillingAddressOption === 'savedAddress') {
        this.formValidation.billingAddress = !!this.selectedBillingAddressId; // Válido si se ha seleccionado un ID
    } 
    else { // sameAsPersonal
      this.formValidation.billingAddress = true; // Siempre válido si se usa la dirección personal
    }

    // Validación para el método de pago
    // Como Stripe se eliminó, la validación de pago ahora se basa en los campos del formulario estándar.
    // La lógica de 'selectedPaymentMethodId' para métodos guardados se desactiva temporalmente.
    if (this.useNewPaymentMethod) {
        const paymentForm = document.getElementById("paymentForm");
        const paymentInputs = paymentForm.querySelectorAll("input[required]"); // Asumiendo que los campos de tarjeta son 'required'
        const allPaymentFieldsValid = Array.from(paymentInputs).every(
          (input) => input.value.trim() !== "" && !input.classList.contains("error")
        );
        // Adicionalmente, asegurar que los campos específicos de la tarjeta (número, expiración, cvv)
        // hayan pasado sus validaciones individuales (que ya actualizan .error).
        // No es necesario verificar 'stripeCardErrorElement' ya que fue eliminado.
        this.formValidation.payment = allPaymentFieldsValid;
    } else {
        // Lógica para métodos de pago guardados (actualmente deshabilitada)
        // this.formValidation.payment = !!this.selectedPaymentMethodId;
        this.formValidation.payment = false; // Deshabilitar si no se usa nuevo método, hasta que se implemente guardado custom
    }

    const purchaseBtn = document.getElementById("completePurchaseBtn");
    if (purchaseBtn) {
      purchaseBtn.disabled = !(
        this.formValidation.personal &&
        this.formValidation.billingAddress && 
        this.formValidation.payment && // Actualizado para incluir la nueva lógica de validación de pago
        this.formValidation.terms
      );
    }
  }

  async updateUserDataIfNeeded() {
    const token = localStorage.getItem('token');
    if (!token || !this.originalUserData) return true; // No hay datos originales o no está logueado, no se puede comparar/actualizar

    const currentData = {
      nombre: document.getElementById('firstName')?.value || null,
      apellido: document.getElementById('lastName')?.value || null,
      telefono: document.getElementById('phone')?.value || null,
      direccion: document.getElementById('address')?.value || null,
      dni: document.getElementById('dni')?.value || null,
    };

    const dataToUpdate = {};
    let needsUpdate = false;

    // Compara solo los campos que el usuario puede editar y que estaban en originalUserData
    // El email no se permite editar aquí, por ejemplo.
    if (this.originalUserData.nombre !== undefined && currentData.nombre !== this.originalUserData.nombre) {
      dataToUpdate.nombre = currentData.nombre;
      needsUpdate = true;
    }
    if (this.originalUserData.apellido !== undefined && currentData.apellido !== this.originalUserData.apellido) {
      dataToUpdate.apellido = currentData.apellido;
      needsUpdate = true;
    }
     // Para campos que podrían ser null o string vacío, manejar con cuidado la comparación
    const originalPhone = this.originalUserData.telefono || "";
    const currentPhone = currentData.telefono || "";
    if (originalPhone !== currentPhone) {
        dataToUpdate.telefono = currentData.telefono;
        needsUpdate = true;
    }

    const originalAddress = this.originalUserData.direccion || "";
    const currentAddress = currentData.direccion || "";
    if (originalAddress !== currentAddress) {
        dataToUpdate.direccion = currentData.direccion;
        needsUpdate = true;
    }
    
    const originalDni = this.originalUserData.dni || "";
    const currentDni = currentData.dni || "";
    if (originalDni !== currentDni) {
        dataToUpdate.dni = currentData.dni;
        needsUpdate = true;
    }


    if (needsUpdate && Object.keys(dataToUpdate).length > 0) {
      try {
        const response = await fetch('/api/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(dataToUpdate),
        });
        if (!response.ok) {
          const errorData = await response.json();
          this.showNotification(`Error al actualizar tus datos: ${errorData.message || response.statusText}`, 'error');
          return false; // Indica que la actualización falló
        }
        const updatedUserData = await response.json();
        this.originalUserData = { ...this.originalUserData, ...updatedUserData }; // Actualizar datos originales guardados
        this.showNotification('Tus datos personales han sido actualizados.', 'success');
        return true; // Indica que la actualización fue exitosa o no necesaria
      } catch (error) {
        this.showNotification(`Error de red al actualizar tus datos: ${error.message}`, 'error');
        return false; // Indica que la actualización falló
      }
    }
    return true; // No se necesitaron actualizaciones o todo está bien
  }

  async handlePurchase(e) {
    e.preventDefault();

    // Primero, validar y actualizar datos del usuario si es necesario
    const userDataUpdated = await this.updateUserDataIfNeeded();
    if (!userDataUpdated) {
      // Si la actualización de datos falló (y era necesaria), no continuar con el pago.
      // Re-habilitar el botón de compra.
      const btn = document.getElementById("completePurchaseBtn");
      const btnText = document.getElementById("btnText");
      if(btn) btn.disabled = false;
      if(btnText) btnText.innerHTML = 'Finalizar compra';
      return; 
    }

    const btn = document.getElementById("completePurchaseBtn");
    const btnText = document.getElementById("btnText");
    btnText.innerHTML = '<span class="loading"></span> Procesando...';
    btn.disabled = true;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Debes iniciar sesión');

      if (!this.orderData.pedidoId || !this.orderData.total) {
        this.showNotification('No se pudo obtener la información del pedido para el pago.', 'error');
        throw new Error('Falta información del pedido (ID o Total).');
      }
      
      const pedidoId = this.orderData.pedidoId;
      const monto = Number(this.orderData.total);

      let idDireccionFacturacionParaPago = null;

      if (this.selectedBillingAddressOption === 'savedAddress' && this.selectedBillingAddressId) {
        idDireccionFacturacionParaPago = this.selectedBillingAddressId;
      } else if (this.selectedBillingAddressOption === 'newAddress') {
        const billingForm = document.getElementById('billingAddressForm');
        const saveBillingAddressCheckbox = document.getElementById('saveBillingAddress');
        
        const nuevaDireccionData = {
          dni: document.getElementById('billingDni').value,
          calle: document.getElementById('billingStreet').value,
          numero: document.getElementById('billingNumber').value || null,
          piso: document.getElementById('billingFloor').value || null,
          departamento: document.getElementById('billingApartment').value || null,
          ciudad: document.getElementById('billingCity').value,
          codigo_postal: document.getElementById('billingZip').value,
          provincia: document.getElementById('billingProvince').value,
          pais: document.getElementById('billingCountry').value,
          es_principal: false, // El backend maneja la lógica de principal si es la única
        };

        // Validar el formulario de nueva dirección antes de intentar guardarla
        let billingFormValid = true;
        const billingInputs = billingForm.querySelectorAll("input[required], select[required]");
        billingInputs.forEach(input => {
            if (!this.validateBillingAddressField(input)) {
                billingFormValid = false;
            }
        });

        if (!billingFormValid) {
            this.showNotification('Por favor, corrige los errores en la dirección de facturación.', 'error');
            btn.disabled = false;
            btnText.innerHTML = 'Finalizar compra';
            return;
        }

        try {
          const resDir = await fetch('/api/direcciones-facturacion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(nuevaDireccionData),
          });
          if (!resDir.ok) {
            const errorData = await resDir.json();
            throw new Error(errorData.message || 'No se pudo guardar la nueva dirección de facturación.');
          }
          const dirGuardada = await resDir.json();
          idDireccionFacturacionParaPago = dirGuardada.id_direccion;
          this.showNotification('Nueva dirección de facturación guardada.', 'success');
          await this.loadSavedBillingAddresses(); // Recargar lista de direcciones
        } catch (error) {
          this.showNotification(error.message, 'error');
          btn.disabled = false;
          btnText.innerHTML = 'Finalizar compra';
          return; // No continuar si falla el guardado de dirección
        }
      }
      // Si es 'sameAsPersonal', idDireccionFacturacionParaPago permanece null, y el backend lo maneja.

      // 3. Construir el body para el endpoint de pagos
      const paymentPayload = {
        pedidoId,
        monto,
        idDireccionFacturacion: idDireccionFacturacionParaPago,
        // Aquí se añadirán los datos del método de pago (paymentMethodId o similar)
        // y la opción de guardarMetodoPago
      };

      // TODO: Integrar la lógica de Stripe Elements para obtener paymentMethodId
      // y la opción de guardarMetodoPago. Por ahora, simulamos un paymentMethodId si no existe.
      // Esto deberá ser reemplazado por la integración real con Stripe.js
      // if (!paymentPayload.paymentMethodId) {
      //     // Simulación temporal hasta integrar Stripe.js para obtener el paymentMethodId real
      //     // En una implementación real, esto vendría de stripe.createPaymentMethod() o similar
      //     // y se pasaría aquí. Si el usuario selecciona un método guardado, ese ID se usaría.
      //     // paymentPayload.paymentMethodId = 'pm_card_visa'; // Ejemplo, ¡NO USAR EN PRODUCCIÓN!
      //     console.warn("Usando paymentMethodId simulado. Reemplazar con integración de Stripe.js");
      // }
       // Aquí se obtendría el paymentMethodId de Stripe Elements
       // y el valor de un checkbox 'guardarMetodoPago'
       // paymentPayload.paymentMethodId = generatedStripePaymentMethodId;
       // paymentPayload.guardarMetodoPago = document.getElementById('guardarMetodoPagoCheckbox').checked;

      document.getElementById('paymentProcessingLoader').style.display = 'block'; // Mostrar loader

      if (this.useNewPaymentMethod) {
        // Stripe is removed. Collect card details directly from form.
        // These will be sent to the backend.
        //
        // ** ADVERTENCIA DE SEGURIDAD IMPORTANTE **
        // La recolección y transmisión de detalles de tarjeta crudos (PAN, CVV, fecha de expiración)
        // desde el frontend al backend como se hace aquí es EXTREMADAMENTE INSEGURA y NO CUMPLE CON PCI DSS.
        // En un sistema de producción, SIEMPRE se debe utilizar una integración segura con un procesador de pagos
        // (como Stripe Elements, Braintree, Adyen, etc.) que tokenice la información de la tarjeta
        // en el lado del cliente para que los datos sensibles nunca toquen su servidor directamente.
        // Este código es solo para fines demostrativos de la lógica de la aplicación SIN la integración de Stripe
        // y para ilustrar el flujo de datos si se manejaran directamente (lo cual no se debe hacer).
        // NO UTILICE ESTE ENFOQUE EN PRODUCCIÓN.
        //
        paymentPayload.cardDetails = {
            cardNumber: document.getElementById('cardNumber')?.value.replace(/\s/g, ""), // Asegúrate que existe este campo
            cardName: document.getElementById('cardName')?.value,
            expiryDate: document.getElementById('expiryDate')?.value, // MM/YY
            cvv: document.getElementById('cvv')?.value // Asegúrate que existe este campo
        };
        paymentPayload.guardarMetodoPago = document.getElementById('savePaymentMethod').checked;
        // The concept of paymentMethodId from Stripe is no longer used here for new cards.
        // The backend will handle this.
      } else if (this.selectedPaymentMethodId) {
        // This part for saved payment methods is currently disabled.
        // If re-enabled, it would use a local ID, not a Stripe PM ID.
        // paymentPayload.paymentMethodId = this.selectedPaymentMethodId;
        this.showNotification('La funcionalidad de métodos de pago guardados está deshabilitada.', 'error');
        btn.disabled = false;
        btnText.innerHTML = 'Finalizar compra';
        document.getElementById('paymentProcessingLoader').style.display = 'none';
        return;
      } else {
        // Should not happen if saved methods are disabled and new method is default
        this.showNotification('Por favor, ingresa un método de pago.', 'error');
        btn.disabled = false;
        btnText.innerHTML = 'Finalizar compra';
        document.getElementById('paymentProcessingLoader').style.display = 'none';
        return;
      }

      // Llamar al endpoint de pagos
      try {
        const res = await fetch('/api/payments', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(paymentPayload)
        });

        const data = await res.json();
        document.getElementById('paymentProcessingLoader').style.display = 'none'; // Ocultar loader

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
            btn.disabled = false;
            btnText.innerHTML = 'Finalizar compra';
        }
      } catch(networkError) {
        document.getElementById('paymentProcessingLoader').style.display = 'none';
        this.showNotification('Error de red al procesar el pago.', 'error');
        btn.disabled = false;
        btnText.innerHTML = 'Finalizar compra';
      }
    } catch (error) { // Catch para errores previos (creación de pedido, etc.)
      document.getElementById('paymentProcessingLoader').style.display = 'none';
      this.showNotification(error.message || 'Error de red', 'error');
      // Si hubo un error antes de pagar, no vaciamos el carrito ni redirigimos
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
});*/
}