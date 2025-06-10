/**
 * Authentication UI Controller
 * Handles visual interactions, animations, and form validation
 * No data storage - purely visual and UX focused
 */

class AuthUI {
    constructor() {
        this.isLoading = false;
        this.passwordStrength = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.setupPasswordStrength();
        this.setupAnimations();
        this.detectFormType();
    }

    detectFormType() {
        // Detect which form we're on based on the form ID
        this.isLoginPage = document.getElementById('loginForm') !== null;
        this.isRegisterPage = document.getElementById('registerForm') !== null;
    }

    setupEventListeners() {
        // Password toggle buttons
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                this.togglePasswordVisibility(e.target.closest('.toggle-password'));
            });
        });

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleFormSubmit(e, 'login'));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleFormSubmit(e, 'register'));
        }

        // Social login buttons
        document.querySelectorAll('[id*="google"], [id*="github"]').forEach(button => {
            button.addEventListener('click', (e) => this.handleSocialAuth(e));
        });

        // Real-time validation
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
            input.addEventListener('input', (e) => this.clearFieldError(e.target));
        });

        // Password strength checking (only on register page)
        if (this.isRegisterPage) {
            const registerPassword = document.getElementById('password');
            if (registerPassword) {
                registerPassword.addEventListener('input', (e) => {
                    this.checkPasswordStrength(e.target.value);
                });
            }

            // Confirm password matching
            const confirmPassword = document.getElementById('confirmPassword');
            if (confirmPassword) {
                confirmPassword.addEventListener('input', () => {
                    this.checkPasswordMatch();
                });
            }
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Close notifications
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('notification-close')) {
                this.closeNotification(e.target.closest('.notification'));
            }
        });
    }

    // Password Visibility Toggle
    togglePasswordVisibility(button) {
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            button.setAttribute('aria-label', 'Ocultar contraseña');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            button.setAttribute('aria-label', 'Mostrar contraseña');
        }
    }

    // Form Submission Handler
    handleFormSubmit(e, formType) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Validate form before submission
        if (!this.validateForm(form)) {
            this.showNotification('Por favor corrige los errores en el formulario', 'error');
            return;
        }

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        this.setLoadingState(submitButton, true);

        // Show success message and simulate redirect
        setTimeout(() => {
            this.setLoadingState(submitButton, false);
            
            if (formType === 'login') {
                this.showNotification('Iniciando sesión...', 'success');
                // The actual form will be submitted to login.php
                setTimeout(() => {
                    form.submit(); // Submit to PHP
                }, 1000);
            } else if (formType === 'register') {
                this.showNotification('Creando cuenta...', 'success');
                // The actual form will be submitted to register.php
                setTimeout(() => {
                    form.submit(); // Submit to PHP
                }, 1000);
            }
        }, 1500);
    }

    // Social Authentication Handler
    handleSocialAuth(e) {
        const provider = e.target.id.includes('google') ? 'google' : 'github';
        const action = this.isLoginPage ? 'login' : 'register';
        
        this.showNotification(`Redirigiendo a ${provider}...`, 'info');

        // Simulate redirect delay
        setTimeout(() => {
            // In a real app, this would redirect to the OAuth provider
            window.location.href = `auth-${provider}.php?action=${action}`;
        }, 1000);
    }

    // Form Validation
    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required]');

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // Additional validation for register form
        if (this.isRegisterPage) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const acceptTerms = document.getElementById('acceptTerms').checked;

            if (password !== confirmPassword) {
                this.showFieldError('confirmPassword', 'Las contraseñas no coinciden');
                isValid = false;
            }

            if (!acceptTerms) {
                this.showFieldError('acceptTerms', 'Debes aceptar los términos y condiciones');
                isValid = false;
            }
        }

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;

        // Skip validation for optional fields that are empty
        if (!field.required && !value) {
            return true;
        }

        switch (fieldName) {
            case 'email':
                if (!this.validateEmail(value)) {
                    this.showFieldError(field.id, 'Por favor ingresa un email válido');
                    isValid = false;
                }
                break;
            case 'firstName':
            case 'lastName':
                if (value.length < 2) {
                    this.showFieldError(field.id, 'Debe tener al menos 2 caracteres');
                    isValid = false;
                }
                break;
            case 'phone':
                if (value && !this.validatePhone(value)) {
                    this.showFieldError(field.id, 'Por favor ingresa un teléfono válido');
                    isValid = false;
                }
                break;
            case 'password':
                if (this.isRegisterPage && !this.validatePassword(value)) {
                    this.showFieldError(field.id, 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números');
                    isValid = false;
                } else if (this.isLoginPage && value.length < 1) {
                    this.showFieldError(field.id, 'La contraseña es requerida');
                    isValid = false;
                }
                break;
            case 'confirmPassword':
                const password = document.getElementById('password').value;
                if (value !== password) {
                    this.showFieldError(field.id, 'Las contraseñas no coinciden');
                    isValid = false;
                }
                break;
        }

        if (isValid) {
            this.clearFieldError(field);
        }

        return isValid;
    }

    // Validation Helpers
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ''));
    }

    validatePassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    // Password Strength Checker (Register page only)
    checkPasswordStrength(password) {
        if (!this.isRegisterPage) return;

        const strengthIndicator = document.getElementById('passwordStrength');
        if (!strengthIndicator) return;

        const strengthFill = strengthIndicator.querySelector('.strength-fill');
        const strengthText = strengthIndicator.querySelector('.strength-text');

        let strength = 0;
        let feedback = '';

        if (password.length === 0) {
            feedback = 'Ingresa una contraseña';
        } else if (password.length < 8) {
            strength = 1;
            feedback = 'Muy débil - Mínimo 8 caracteres';
        } else {
            strength = 1;
            feedback = 'Débil';

            // Check for lowercase
            if (/[a-z]/.test(password)) strength++;
            
            // Check for uppercase
            if (/[A-Z]/.test(password)) strength++;
            
            // Check for numbers
            if (/\d/.test(password)) strength++;
            
            // Check for special characters
            if (/[@$!%*?&]/.test(password)) strength++;

            // Update feedback based on strength
            switch (strength) {
                case 2:
                    feedback = 'Débil';
                    break;
                case 3:
                    feedback = 'Regular';
                    break;
                case 4:
                    feedback = 'Buena';
                    break;
                case 5:
                    feedback = 'Muy fuerte';
                    break;
            }
        }

        // Update visual indicator
        strengthFill.className = 'strength-fill';
        if (strength > 0) {
            const strengthClasses = ['', 'weak', 'fair', 'good', 'strong'];
            strengthFill.classList.add(strengthClasses[Math.min(strength, 4)]);
        }

        strengthText.textContent = feedback;
        this.passwordStrength = strength;
    }

    checkPasswordMatch() {
        if (!this.isRegisterPage) return;

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (confirmPassword.length > 0 && password !== confirmPassword) {
            this.showFieldError('confirmPassword', 'Las contraseñas no coinciden');
        } else {
            this.clearFieldError(document.getElementById('confirmPassword'));
        }
    }

    // Error Handling
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const inputGroup = field.closest('.input-group') || field.closest('.form-group');
        const errorElement = document.getElementById(`${fieldId}Error`);

        if (inputGroup) {
            inputGroup.classList.add('error');
        }

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearFieldError(field) {
        const inputGroup = field.closest('.input-group') || field.closest('.form-group');
        const errorElement = document.getElementById(`${field.id}Error`);

        if (inputGroup) {
            inputGroup.classList.remove('error');
        }

        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
    }

    clearAllErrors() {
        document.querySelectorAll('.input-group.error, .form-group.error').forEach(group => {
            group.classList.remove('error');
        });

        document.querySelectorAll('.error-message.show').forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });
    }

    // Loading States
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

    // Notifications
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

        // Auto remove after duration
        setTimeout(() => {
            this.closeNotification(notification);
        }, duration);
    }

    closeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
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

    // Utility Methods
    handleKeyboardShortcuts(e) {
        // Enter key on form submission
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            const form = e.target.closest('form');
            if (form && !this.isLoading) {
                e.preventDefault();
                form.dispatchEvent(new Event('submit'));
            }
        }

        // Escape key to clear errors
        if (e.key === 'Escape') {
            this.clearAllErrors();
        }
    }

    setupFormValidation() {
        // Add real-time validation classes
        document.querySelectorAll('input[required]').forEach(input => {
            input.addEventListener('invalid', (e) => {
                e.preventDefault();
                this.validateField(e.target);
            });
        });
    }

    setupPasswordStrength() {
        // Initialize password strength indicator (register page only)
        if (this.isRegisterPage) {
            const registerPassword = document.getElementById('password');
            if (registerPassword) {
                this.checkPasswordStrength('');
            }
        }
    }

    setupAnimations() {
        // Add staggered animation delays to form groups
        document.querySelectorAll('.form-group').forEach((group, index) => {
            group.style.setProperty('--index', index);
        });

        // Intersection Observer for entrance animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = `${Math.random() * 0.3}s`;
                    entry.target.classList.add('animate-in');
                }
            });
        });

        document.querySelectorAll('.form-group, .btn, .feature').forEach(el => {
            observer.observe(el);
        });
    }

    // Public API Methods
    showGlobalLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    hideGlobalLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }
}

// Initialize Auth UI when DOM is loaded
let authUI;

document.addEventListener('DOMContentLoaded', function() {
    authUI = new AuthUI();
    
    console.log(`
🔐 Authentication UI Initialized!

📋 Features Active:
==================
✅ Form validation
✅ Password strength indicator
✅ Password visibility toggle
✅ Social authentication buttons
✅ Loading states
✅ Error handling
✅ Keyboard shortcuts
✅ Responsive design
✅ Accessibility support
✅ Smooth animations

🎯 Ready for PHP Integration:
============================
- Forms will submit to login.php and register.php
- All form data is properly named for PHP processing
- Visual feedback provided during submission
- No data stored in JavaScript

🔧 Customization:
================
- Modify CSS variables for theming
- Update validation rules as needed
- Add more social providers
- Customize animations and transitions
    `);
});

// Global API for external use
window.AuthAPI = {
    showNotification: function(text, type, duration) {
        if (authUI) authUI.showNotification(text, type, duration);
    },
    
    showLoading: function() {
        if (authUI) authUI.showGlobalLoading();
    },
    
    hideLoading: function() {
        if (authUI) authUI.hideGlobalLoading();
    },
    
    clearAllErrors: function() {
        if (authUI) authUI.clearAllErrors();
    }
};