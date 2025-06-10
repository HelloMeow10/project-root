/**
 * Forgot Password UI Controller
 * Handles ONLY visual interactions, animations, and client-side validation
 * NO data processing - forms submit directly to PHP
 */

class ForgotPasswordUI {
    constructor() {
        this.passwordStrength = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPasswordRequirements();
        this.setupFormValidation();
        this.setupAnimations();
        this.detectPageType();
    }

    detectPageType() {
        // Detect which page we're on
        this.isForgotPage = document.getElementById('forgotPasswordForm') !== null;
        this.isResetPage = document.getElementById('resetPasswordForm') !== null;
        
        // Get token from URL if on reset page
        if (this.isResetPage) {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            if (token) {
                document.getElementById('resetToken').value = token;
            }
        }
    }

    setupEventListeners() {
        // Password toggle buttons
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                this.togglePasswordVisibility(e.target.closest('.toggle-password'));
            });
        });

        // Real-time validation
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
            input.addEventListener('input', (e) => this.clearFieldError(e.target));
        });

        // Password strength checking (only on reset page)
        if (this.isResetPage) {
            const newPassword = document.getElementById('newPassword');
            if (newPassword) {
                newPassword.addEventListener('input', (e) => {
                    this.checkPasswordStrength(e.target.value);
                    this.updatePasswordRequirements(e.target.value);
                });
            }

            // Confirm password matching
            const confirmPassword = document.getElementById('confirmNewPassword');
            if (confirmPassword) {
                confirmPassword.addEventListener('input', () => {
                    this.checkPasswordMatch();
                });
            }
        }

        // Form submissions - add loading states but let forms submit naturally
        const forgotForm = document.getElementById('forgotPasswordForm');
        const resetForm = document.getElementById('resetPasswordForm');

        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => {
                if (!this.validateForm(forgotForm)) {
                    e.preventDefault();
                    return;
                }
                this.setLoadingState(document.getElementById('sendResetButton'), true);
            });
        }

        if (resetForm) {
            resetForm.addEventListener('submit', (e) => {
                if (!this.validateForm(resetForm)) {
                    e.preventDefault();
                    return;
                }
                this.setLoadingState(document.getElementById('resetPasswordButton'), true);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
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

    // Form Validation
    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required]:not([type="hidden"])');

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // Additional validation for reset form
        if (this.isResetPage && form.id === 'resetPasswordForm') {
            const password = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;

            if (password !== confirmPassword) {
                this.showFieldError('confirmNewPassword', 'Las contraseñas no coinciden');
                isValid = false;
            }

            if (!this.validatePassword(password)) {
                this.showFieldError('newPassword', 'La contraseña no cumple con los requisitos');
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
            case 'password':
                if (this.isResetPage && !this.validatePassword(value)) {
                    this.showFieldError(field.id, 'La contraseña debe cumplir con todos los requisitos');
                    isValid = false;
                }
                break;
            case 'confirmPassword':
                if (!this.checkPasswordMatch()) {
                    isValid = false;
                }
                break;
        }

        if (isValid) {
            this.clearFieldError(field);
        }

        return isValid;
    }

    // Password strength checker
    checkPasswordStrength(password) {
        if (!this.isResetPage) return;

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

    // Update password requirements checklist
    updatePasswordRequirements(password) {
        if (!this.isResetPage) return;

        const requirements = {
            'req-length': password.length >= 8,
            'req-uppercase': /[A-Z]/.test(password),
            'req-lowercase': /[a-z]/.test(password),
            'req-number': /\d/.test(password)
        };

        Object.keys(requirements).forEach(reqId => {
            const element = document.getElementById(reqId);
            if (!element) return;
            
            const icon = element.querySelector('i');
            
            if (requirements[reqId]) {
                element.classList.add('valid');
                icon.className = 'fas fa-check';
            } else {
                element.classList.remove('valid');
                icon.className = 'fas fa-times';
            }
        });
    }

    // Setup password requirements
    setupPasswordRequirements() {
        if (this.isResetPage) {
            const newPassword = document.getElementById('newPassword');
            if (newPassword) {
                this.updatePasswordRequirements('');
                this.checkPasswordStrength('');
            }
        }
    }

    // Check password match
    checkPasswordMatch() {
        if (!this.isResetPage) return true;

        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (confirmPassword.length > 0 && password !== confirmPassword) {
            this.showFieldError('confirmNewPassword', 'Las contraseñas no coinciden');
            return false;
        } else {
            this.clearFieldError(document.getElementById('confirmNewPassword'));
            return true;
        }
    }

    // Validation helpers
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    // Error handling
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

    // Loading states
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

    // Utility methods
    handleKeyboardShortcuts(e) {
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

        document.querySelectorAll('.form-group, .btn, .step, .security-features .feature').forEach(el => {
            observer.observe(el);
        });
    }
}

// Initialize Forgot Password UI when DOM is loaded
let forgotPasswordUI;

document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on a forgot/reset password page
    if (document.getElementById('forgotPasswordForm') || document.getElementById('resetPasswordForm')) {
        forgotPasswordUI = new ForgotPasswordUI();
        
        console.log(`
🔐 Forgot Password UI Initialized!

📋 Visual Features Active:
=========================
✅ Password visibility toggles
✅ Real-time form validation
✅ Password strength indicator
✅ Password requirements checklist
✅ Loading states for buttons
✅ Error handling and display
✅ Keyboard shortcuts
✅ Responsive animations
✅ Accessibility support

🎯 Form Processing:
==================
- Forms submit directly to PHP
- No data interception or simulation
- Client-side validation only
- Token handling via URL parameters

🔧 Pages Supported:
==================
- forgot-password.html → forgot-password.php
- reset-password.html → reset-password.php
        `);
    }
});

// Global API for external use (minimal, design-focused)
window.ForgotPasswordAPI = {
    clearAllErrors: function() {
        if (forgotPasswordUI) forgotPasswordUI.clearAllErrors();
    },
    
    validateForm: function(formId) {
        if (forgotPasswordUI) {
            const form = document.getElementById(formId);
            return form ? forgotPasswordUI.validateForm(form) : false;
        }
        return false;
    }
};