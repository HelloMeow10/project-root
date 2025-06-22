class CheckoutManager {
  constructor() {
    this.orderData = {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    };

    this.orderData = {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    };
    this.originalUserData = null; // Para guardar los datos originales del usuario
    
    // Billing Address
    this.savedBillingAddresses = [];
    this.selectedBillingAddressOption = 'sameAsPersonal'; // 'sameAsPersonal', 'newAddress', 'savedAddress'
    this.selectedBillingAddressId = null;

    // Stripe and Payment Methods
    this.stripe = null;
    this.cardElement = null;
    this.savedPaymentMethods = [];
    this.selectedPaymentMethodId = null; // ID de Stripe del método seleccionado o nuevo
    this.useNewPaymentMethod = true; // Por defecto, mostrar para nueva tarjeta si no hay guardadas

    this.formValidation = {
      personal: false,
      billingAddress: true, // Asumir true inicialmente si 'sameAsPersonal' es default
      payment: false,
      terms: false,
    };

    this.init();
  }

  async init() {
    await this.loadUserData(); // Asegurarse de que se complete antes de continuar
    this.setupEventListeners();
    this.setupFormValidation();
    this.initializeStripeElements(); // Inicializar Stripe
    this.loadSavedBillingAddresses(); // Cargar direcciones guardadas
    this.loadSavedPaymentMethods(); // Cargar métodos de pago guardados
    this.loadOrderSummary();
  }

  initializeStripeElements() {
    // Reemplaza 'TU_STRIPE_PUBLIC_KEY' con tu clave pública real de Stripe
    // Idealmente, esta clave vendría de una variable de entorno o configuración.
    const stripePublicKey = window.STRIPE_PUBLIC_KEY || 'pk_test_51Rcbaj9ZvfEsRh7Eom4jIDS2QrmwBmwvYaBS5OAKeRWlGvqGFObZjxc4QY7MU18XlnqODFF4BCseGqFnDSHKoE3k00kTrOOSsQ'; // Placeholder
    if (!stripePublicKey.startsWith('pk_test_') && !stripePublicKey.startsWith('pk_live_')) {
        console.error("Clave pública de Stripe no configurada o inválida. Por favor, configúrala.");
        this.showNotification("Error de configuración de pagos. Contacta a soporte.", "error");
        return;
    }
    
    this.stripe = Stripe(stripePublicKey);
    const elements = this.stripe.elements();
    
    // Estilos para el Card Element (puedes personalizarlos)
    const style = {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4"
        }
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a"
      }
    };

    this.cardElement = elements.create('card', { style: style, hidePostalCode: true });
    const cardElementContainer = document.getElementById('stripeCardElement');
    if (cardElementContainer) {
        this.cardElement.mount('#stripeCardElement');
        this.cardElement.on('change', (event) => {
            const displayError = document.getElementById('stripeCardError');
            if (event.error) {
                displayError.textContent = event.error.message;
                displayError.classList.add('show');
            } else {
                displayError.textContent = '';
                displayError.classList.remove('show');
            }
            this.updateFormValidation(); // Revalidar cuando cambia el Card Element
        });
    } else {
        console.error("Contenedor para Stripe Card Element ('stripeCardElement') no encontrado.");
    }
  }

  async loadSavedPaymentMethods() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const selectElement = document.getElementById('selectSavedPaymentMethod');
    const paymentForm = document.getElementById('paymentForm');
    const savedMethodsContainer = document.getElementById('savedPaymentMethodsContainer');
    const useNewLink = document.getElementById('useNewPaymentMethodLink');
    const deleteBtn = document.getElementById('deletePaymentMethodBtn');


    try {
      const response = await fetch('/api/payments/metodos-pago', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        console.error('Error al cargar métodos de pago guardados');
        if (selectElement) selectElement.innerHTML = '<option value="">Error al cargar</option>';
        this.useNewPaymentMethod = true; // Forzar nuevo si falla la carga
        this.togglePaymentMethodForm();
        return;
      }
      this.savedPaymentMethods = await response.json();

      if (selectElement) {
        if (this.savedPaymentMethods.length > 0) {
          selectElement.innerHTML = '<option value="">Selecciona un método guardado</option>';
          this.savedPaymentMethods.forEach(pm => {
            const option = document.createElement('option');
            option.value = pm.stripe_payment_method_id;
            option.textContent = `${pm.tipo_tarjeta.toUpperCase()} **** ${pm.ultimos_cuatro_digitos} (Exp: ${pm.fecha_expiracion})${pm.es_principal ? ' - Principal' : ''}`;
            option.dataset.localId = pm.id_metodo_pago; // Guardar ID local para otras acciones
            selectElement.appendChild(option);
          });
          this.useNewPaymentMethod = false; // Hay guardados, no mostrar nuevo por defecto
          if (deleteBtn) deleteBtn.style.display = 'inline-block';
        } else {
          selectElement.innerHTML = '<option value="">No tienes métodos guardados</option>';
          selectElement.disabled = true;
          this.useNewPaymentMethod = true;
          if (savedMethodsContainer) savedMethodsContainer.style.display = 'none'; // Ocultar si no hay
          if (deleteBtn) deleteBtn.style.display = 'none';
        }
      }
      this.togglePaymentMethodForm();
    } catch (error) {
      console.error('Error en loadSavedPaymentMethods:', error);
      if (selectElement) selectElement.innerHTML = '<option value="">Error al cargar</option>';
      this.useNewPaymentMethod = true;
      this.togglePaymentMethodForm();
    }
  }

  togglePaymentMethodForm() {
    const paymentForm = document.getElementById('paymentForm');
    const savedMethodsContainer = document.getElementById('savedPaymentMethodsContainer');
    if (this.useNewPaymentMethod) {
        if (paymentForm) paymentForm.style.display = 'block';
        if (savedMethodsContainer && this.savedPaymentMethods.length > 0) {
             // No ocultar el contenedor de guardados, solo el select si se decide
        }
        this.selectedPaymentMethodId = null; // Al mostrar nuevo, deseleccionar guardado
        const selectSaved = document.getElementById('selectSavedPaymentMethod');
        if(selectSaved) selectSaved.value = "";

    } else {
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
    if (this.useNewPaymentMethod) {
        const cardNameInput = document.getElementById('cardName');
        const cardNameValid = cardNameInput && cardNameInput.value.trim() !== "" && !cardNameInput.classList.contains("error");
        // El Card Element de Stripe se valida a través de su evento 'change' y el error se muestra en stripeCardError
        // Asumimos que si no hay error en stripeCardError, el Card Element es válido o está incompleto.
        // Para una validación más estricta del Card Element antes de enviar, se podría verificar this.cardElement._complete o similar,
        // pero el evento 'change' es la forma recomendada de obtener el estado.
        const stripeCardErrorElement = document.getElementById('stripeCardError');
        const cardElementValid = stripeCardErrorElement && !stripeCardErrorElement.classList.contains('show');
        this.formValidation.payment = cardNameValid && cardElementValid;
    } else { // Usando un método de pago guardado
        this.formValidation.payment = !!this.selectedPaymentMethodId; // Válido si se ha seleccionado un ID de Stripe
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
      const monto = Number(this.orderData.total); // Usar el total calculado en frontend que incluye impuestos

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
        if (!this.stripe || !this.cardElement) {
          this.showNotification('Error de inicialización de Stripe. Intenta de nuevo.', 'error');
          btn.disabled = false;
          btnText.innerHTML = 'Finalizar compra';
          document.getElementById('paymentProcessingLoader').style.display = 'none';
          return;
        }

        const cardHolderName = document.getElementById('cardName').value;
        const { error: createPmError, paymentMethod } = await this.stripe.createPaymentMethod({
          type: 'card',
          card: this.cardElement,
          billing_details: {
            name: cardHolderName,
            // Podrías añadir email y address aquí si es relevante para Stripe/prevención de fraude
          },
        });

        if (createPmError) {
          this.showNotification(createPmError.message, 'error');
          btn.disabled = false;
          btnText.innerHTML = 'Finalizar compra';
          document.getElementById('paymentProcessingLoader').style.display = 'none';
          return;
        }
        
        paymentPayload.paymentMethodId = paymentMethod.id;
        paymentPayload.guardarMetodoPago = document.getElementById('savePaymentMethod').checked;

        // Si se quiere guardar y es un nuevo método, se podría hacer un SetupIntent aquí primero
        // para asegurar que el método esté configurado para uso futuro antes del pago,
        // o confiar en que el backend lo guarde después del pago si `guardarMetodoPago` es true.
        // El backend ya tiene lógica para guardar un PM nuevo si `guardarMetodoPago` es true.

      } else if (this.selectedPaymentMethodId) {
        paymentPayload.paymentMethodId = this.selectedPaymentMethodId; // Usar el PM guardado
        paymentPayload.guardarMetodoPago = false; // No es necesario (ni posible) re-guardar un PM ya guardado de esta forma
      } else {
        this.showNotification('Por favor, selecciona un método de pago o ingresa uno nuevo.', 'error');
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
});