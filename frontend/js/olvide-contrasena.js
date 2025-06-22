class ForgotPasswordUI {
    constructor() {
        this.passwordStrength = 0; // Aunque no se usa en forgot, puede ser útil para reset
        this.API_BASE_URL = '/api/auth';

        // Elementos del DOM para la página de olvido de contraseña
        this.forgotPasswordForm = document.getElementById('forgotPasswordForm');
        this.sendResetButton = document.getElementById('sendResetButton');
        this.emailInput = document.getElementById('email');
        this.emailError = document.getElementById('emailError');

        // Elementos comunes o para notificaciones/carga
        this.notificationContainer = document.getElementById('notificationContainer');
        this.loadingOverlay = document.getElementById('loadingOverlay');

        this.init();
    }

    init() {
        this.setupEventListeners();
        // Mantén tus validaciones visuales y animaciones si son generales
        this.setupFormValidation();
        this.setupAnimations();
    }

    setupEventListeners() {
        // Event listener para el formulario de olvido de contraseña
        if (this.forgotPasswordForm) {
            this.forgotPasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.validateForgotForm()) { // Validar solo el formulario de olvido
                    this.handleForgotPassword();
                }
            });
        }

        // Real-time validation (visual) para inputs en general
        if (this.emailInput) {
            this.emailInput.addEventListener('blur', (e) => this.validateField(e.target));
            this.emailInput.addEventListener('input', (e) => this.clearFieldError(e.target));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    async handleForgotPassword() {
        if (!this.emailInput) return;
        const email = this.emailInput.value;

        this.setLoadingState(this.sendResetButton, true);
        this.showLoadingOverlay(true);
        this.clearAllErrors(); // Limpiar errores previos

        try {
            const response = await fetch(`${this.API_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification(data.message || 'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.', 'success');
                if (this.emailInput) this.emailInput.value = '';
            } else {
                // Intentar mostrar el error en el campo de email si es relevante
                if (response.status === 400 && data.message && data.message.toLowerCase().includes('email')) {
                    this.showFieldError(this.emailInput.id, data.message);
                } else {
                     this.showNotification(data.message || 'Ocurrió un error. Inténtalo de nuevo.', 'error');
                }
            }
        } catch (error) {
            console.error('Error en forgotPassword:', error);
            this.showNotification('Error de conexión. Verifica tu red e inténtalo de nuevo.', 'error');
        } finally {
            this.setLoadingState(this.sendResetButton, false);
            this.showLoadingOverlay(false);
        }
    }

    // --- Métodos de UI (Notificaciones, validación visual, etc.) ---

    showLoadingOverlay(isLoading) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = isLoading ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        if (!this.notificationContainer) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`; // No añadir 'show' aquí inicialmente

        const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle';
        notification.innerHTML = `
            <div class="notification-icon"><i class="fas ${iconClass}"></i></div>
            <div class="notification-content">
                <p class="notification-message">${message}</p>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;

        this.notificationContainer.appendChild(notification);

        // Forzar reflujo para asegurar que la animación de entrada se ejecute
        void notification.offsetWidth;
        notification.classList.add('show');


        const autoHideTimeout = setTimeout(() => {
            notification.classList.remove('show'); // Inicia animación de salida quitando 'show'
            setTimeout(() => notification.remove(), 500); // Elimina después de la animación de salida
        }, duration);

        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoHideTimeout);
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        });
    }

    // Validación específica para el formulario de olvido de contraseña
    validateForgotForm() {
        let isValid = true;
        if (this.emailInput && !this.validateField(this.emailInput)) {
            isValid = false;
        }
        return isValid;
    }

    // Validación genérica de campo (visual)
    validateField(field) {
        if (!field) return true;

        const value = field.value.trim();
        const fieldName = field.name || field.id;
        let isValid = true;

        this.clearFieldError(field);

        if (field.required && !value) {
            this.showFieldError(field.id, 'Este campo es requerido.');
            isValid = false;
        } else if (value) {
            switch (fieldName) {
                case 'email':
                    if (!this.validateEmail(value)) {
                        this.showFieldError(field.id, 'Por favor ingresa un email válido.');
                        isValid = false;
                    }
                    break;
            }
        }
        return isValid;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const inputGroup = field.closest('.input-group') || field.closest('.form-group');
        let errorElement = document.getElementById(`${fieldId}Error`);

        if (!errorElement && inputGroup) {
            errorElement = document.createElement('span');
            errorElement.className = 'error-message';
            errorElement.id = `${fieldId}Error`;
            inputGroup.insertAdjacentElement('afterend', errorElement);
        } else if (!errorElement && field.parentElement) {
             errorElement = document.createElement('span');
            errorElement.className = 'error-message';
            errorElement.id = `${fieldId}Error`;
            field.parentElement.appendChild(errorElement);
        }

        if (inputGroup) inputGroup.classList.add('error');
        if (field) field.classList.add('error-input');

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearFieldError(field) {
        if (!field) return;
        const fieldId = field.id;
        const inputGroup = field.closest('.input-group') || field.closest('.form-group');
        const errorElement = document.getElementById(`${fieldId}Error`);

        if (inputGroup) inputGroup.classList.remove('error');
        if (field) field.classList.remove('error-input');

        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
    }

    clearAllErrors() {
        document.querySelectorAll('.input-group.error, .form-group.error').forEach(group => {
            group.classList.remove('error');
        });
        document.querySelectorAll('input.error-input').forEach(input => {
            input.classList.remove('error-input');
        });
        document.querySelectorAll('.error-message.show').forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });
    }

    setLoadingState(button, isLoading) {
        if (!button) return;
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.key === 'Escape') this.clearAllErrors();
    }

    setupFormValidation() {
        if (this.forgotPasswordForm) { // Asegurarse que el form existe
            this.forgotPasswordForm.querySelectorAll('input[required]').forEach(input => {
                input.addEventListener('invalid', (e) => {
                    e.preventDefault();
                    this.validateField(e.target);
                });
            });
        }
    }

    setupAnimations() {
        document.querySelectorAll('.form-group').forEach((group, index) => {
            group.style.setProperty('--index', index);
        });
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = `${Math.random() * 0.3}s`;
                    entry.target.classList.add('animate-in');
                }
            });
        });
        document.querySelectorAll('.form-group, .btn, .step').forEach(el => {
            observer.observe(el);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('forgotPasswordForm')) {
        new ForgotPasswordUI();
        console.log("ForgotPasswordUI initialized for forgotPasswordForm.");
    }
});
