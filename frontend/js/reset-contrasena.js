class ResetPasswordUI {
    constructor() {
        this.API_BASE_URL = '/api/auth';

        // Elementos del DOM
        this.resetPasswordForm = document.getElementById('resetPasswordForm');
        this.resetButton = document.getElementById('resetPasswordButton');
        this.newPasswordInput = document.getElementById('newPassword');
        this.confirmNewPasswordInput = document.getElementById('confirmNewPassword');
        this.resetTokenInput = document.getElementById('resetToken');

        this.newPasswordError = document.getElementById('newPasswordError');
        this.confirmNewPasswordError = document.getElementById('confirmNewPasswordError');

        this.passwordStrengthIndicator = document.getElementById('passwordStrength');
        this.strengthFill = this.passwordStrengthIndicator ? this.passwordStrengthIndicator.querySelector('.strength-fill') : null;
        this.strengthText = this.passwordStrengthIndicator ? this.passwordStrengthIndicator.querySelector('.strength-text') : null;

        this.requirements = {
            'req-length': document.getElementById('req-length'),
            'req-uppercase': document.getElementById('req-uppercase'),
            'req-lowercase': document.getElementById('req-lowercase'),
            'req-number': document.getElementById('req-number')
        };

        this.notificationContainer = document.getElementById('notificationContainer');
        this.loadingOverlay = document.getElementById('loadingOverlay');

        this.init();
    }

    init() {
        this.extractTokenFromURL();
        this.setupEventListeners();
        this.setupFormValidation();
        this.setupAnimations();
        if(this.newPasswordInput) { // Inicializar visualización de requisitos
            this.updatePasswordRequirements('');
            this.checkPasswordStrength('');
        }
    }

    extractTokenFromURL() {
        if (this.resetTokenInput) {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            if (token) {
                this.resetTokenInput.value = token;
            } else {
                this.showNotification('Token de restablecimiento no encontrado o inválido. Solicita un nuevo enlace.', 'error');
                if(this.resetButton) this.resetButton.disabled = true;
            }
        }
    }

    setupEventListeners() {
        if (this.resetPasswordForm) {
            this.resetPasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.validateResetForm()) {
                    this.handleResetPassword();
                }
            });
        }

        if (this.newPasswordInput) {
            this.newPasswordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
                this.updatePasswordRequirements(e.target.value);
                this.validateField(this.newPasswordInput); // Validar en tiempo real
                if(this.confirmNewPasswordInput.value) this.validateField(this.confirmNewPasswordInput); // Re-validar confirmación
            });
             this.newPasswordInput.addEventListener('blur', (e) => this.validateField(e.target));
        }

        if (this.confirmNewPasswordInput) {
            this.confirmNewPasswordInput.addEventListener('input', () => {
                this.validateField(this.confirmNewPasswordInput);
            });
            this.confirmNewPasswordInput.addEventListener('blur', (e) => this.validateField(e.target));
        }

        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                this.togglePasswordVisibility(e.currentTarget); // currentTarget es el botón
            });
        });

        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    togglePasswordVisibility(button) {
        const targetId = button.dataset.target;
        if (!targetId) return;
        const input = document.getElementById(targetId);
        if (!input) return;
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
            button.setAttribute('aria-label', 'Ocultar contraseña');
        } else {
            input.type = 'password';
            if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
            button.setAttribute('aria-label', 'Mostrar contraseña');
        }
    }

    async handleResetPassword() {
        const token = this.resetTokenInput.value;
        const nuevaContrasena = this.newPasswordInput.value;

        this.setLoadingState(this.resetButton, true);
        this.showLoadingOverlay(true);
        this.clearAllErrors();

        try {
            const response = await fetch(`${this.API_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, nuevaContrasena }),
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification(data.message || 'Contraseña restablecida con éxito. Serás redirigido al login.', 'success', 3000);
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                 this.showNotification(data.message || 'Error al restablecer la contraseña. Inténtalo de nuevo o solicita un nuevo enlace.', 'error');
            }
        } catch (error) {
            console.error('Error en resetPassword:', error);
            this.showNotification('Error de conexión. Verifica tu red e inténtalo de nuevo.', 'error');
        } finally {
            this.setLoadingState(this.resetButton, false);
            this.showLoadingOverlay(false);
        }
    }

    // --- Métodos de UI ---
    checkPasswordStrength(password) {
        if (!this.strengthFill || !this.strengthText) return;
        let strength = 0;
        let feedbackText = '';

        if (password.length === 0) {
            strength = 0;
            feedbackText = 'Ingresa una contraseña';
        } else if (password.length < 8) {
            strength = 1; // Muy débil
            feedbackText = 'Muy débil - Mínimo 8 caracteres';
        } else {
            strength = 1; // Débil por defecto si tiene >= 8
            if (/[a-z]/.test(password)) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/\d/.test(password)) strength++;
            if (/[^a-zA-Z\d]/.test(password)) strength++; // Caracter especial

            if (strength <= 2) feedbackText = 'Débil';
            else if (strength === 3) feedbackText = 'Regular';
            else if (strength === 4) feedbackText = 'Buena';
            else feedbackText = 'Fuerte';
        }

        const strengthClasses = ['', 'weak', 'weak', 'fair', 'good', 'strong'];
        this.strengthFill.className = 'strength-fill ' + (strengthClasses[strength] || '');
        this.strengthText.textContent = feedbackText;
    }

    updatePasswordRequirements(password) {
        const results = {
            'req-length': password.length >= 8,
            'req-uppercase': /[A-Z]/.test(password),
            'req-lowercase': /[a-z]/.test(password),
            'req-number': /\d/.test(password)
        };

        for (const reqId in results) {
            const el = this.requirements[reqId];
            if (el) {
                const icon = el.querySelector('i');
                if (results[reqId]) {
                    el.classList.add('valid');
                    if (icon) icon.className = 'fas fa-check';
                } else {
                    el.classList.remove('valid');
                    if (icon) icon.className = 'fas fa-times';
                }
            }
        }
    }

    validateResetForm() {
        let isValid = true;
        if (!this.validateField(this.newPasswordInput)) isValid = false;
        if (!this.validateField(this.confirmNewPasswordInput)) isValid = false;
        return isValid;
    }

    validateField(field) {
        if (!field) return true;
        const value = field.value.trim();
        const fieldId = field.id;
        let isValid = true;
        this.clearFieldError(field);

        if (field.required && !value) {
            this.showFieldError(fieldId, 'Este campo es requerido.');
            return false;
        }

        if (fieldId === 'newPassword') {
            const passwordCriteria = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordCriteria.test(value)) {
                this.showFieldError(fieldId, 'Debe tener 8+ caracteres, mayúscula, minúscula y número.');
                isValid = false;
            }
        } else if (fieldId === 'confirmNewPassword') {
            if (this.newPasswordInput && value !== this.newPasswordInput.value) {
                this.showFieldError(fieldId, 'Las contraseñas no coinciden.');
                isValid = false;
            }
        }
        return isValid;
    }

    showLoadingOverlay(isLoading) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = isLoading ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        if (!this.notificationContainer) return;
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle';
        notification.innerHTML = `<div class="notification-icon"><i class="fas ${iconClass}"></i></div><div class="notification-content"><p class="notification-message">${message}</p></div><button class="notification-close"><i class="fas fa-times"></i></button>`;
        this.notificationContainer.appendChild(notification);
        void notification.offsetWidth;
        notification.classList.add('show');
        const autoHideTimeout = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, duration);
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoHideTimeout);
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        });
    }

    showFieldError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}Error`);
        const field = document.getElementById(fieldId);
        if (field) field.classList.add('error-input');
        const inputGroup = field ? field.closest('.input-group') || field.closest('.form-group') : null;
        if (inputGroup) inputGroup.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearFieldError(field) {
        if (!field) return;
        const errorElement = document.getElementById(`${field.id}Error`);
        field.classList.remove('error-input');
        const inputGroup = field.closest('.input-group') || field.closest('.form-group');
        if (inputGroup) inputGroup.classList.remove('error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    clearAllErrors() {
        document.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
        document.querySelectorAll('.input-group.error, .form-group.error').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.error-message.show').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
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
        if(this.resetPasswordForm){
            this.resetPasswordForm.querySelectorAll('input[required]').forEach(input => {
                input.addEventListener('invalid', (e) => {
                    e.preventDefault();
                    this.validateField(e.target);
                });
            });
        }
    }

    setupAnimations() {
        document.querySelectorAll('.form-group, .password-requirements').forEach((group, index) => {
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
        document.querySelectorAll('.form-group, .btn, .security-features .feature, .password-requirements').forEach(el => {
            observer.observe(el);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('resetPasswordForm')) {
        new ResetPasswordUI();
        console.log("ResetPasswordUI initialized for resetPasswordForm.");
    }
});
