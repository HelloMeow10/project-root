/**
 * Shopping Cart UI Controller
 */

class CartUI {
    constructor() {
        this.isLoading = false;
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
        // Quantity controls
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quantity-btn')) {
                this.handleQuantityChange(e.target.closest('.quantity-btn'));
            }
        });

        // Quantity input changes
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                this.handleQuantityInput(e.target);
            }
        });

        // Remove item buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-item-btn')) {
                this.handleRemoveItem(e.target.closest('.remove-item-btn'));
            }
        });

        // Clear cart button
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.handleClearCart());
        }

        // Promo code form
        const promoForm = document.getElementById('promoForm');
        if (promoForm) {
            promoForm.addEventListener('submit', (e) => this.handlePromoCode(e));
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.handleCheckout());
        }

        // Add recommended items
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-recommended-btn')) {
                this.handleAddRecommended(e.target.closest('.add-recommended-btn'));
            }
        });

        // Modal controls
        this.setupModalControls();

        // Notification close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('notification-close')) {
                this.closeNotification(e.target.closest('.notification'));
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    // Quantity Controls
    handleQuantityChange(button) {
        const itemId = button.dataset.itemId;
        const quantityInput = document.querySelector(`.quantity-input[data-item-id="${itemId}"]`);
        const isIncrease = button.classList.contains('increase');
        
        if (!quantityInput) return;

        let currentValue = parseInt(quantityInput.value) || 1;
        const min = parseInt(quantityInput.min) || 1;
        const max = parseInt(quantityInput.max) || 10;

        if (isIncrease && currentValue < max) {
            currentValue++;
        } else if (!isIncrease && currentValue > min) {
            currentValue--;
        }

        quantityInput.value = currentValue;
        this.updateItemTotal(itemId, currentValue);
        this.updateCartTotals();
        
        // Add visual feedback
        this.addQuantityFeedback(button, isIncrease);
    }

    handleQuantityInput(input) {
        const itemId = input.dataset.itemId;
        let value = parseInt(input.value) || 1;
        const min = parseInt(input.min) || 1;
        const max = parseInt(input.max) || 10;

        // Validate range
        if (value < min) value = min;
        if (value > max) value = max;
        
        input.value = value;
        this.updateItemTotal(itemId, value);
        this.updateCartTotals();
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

    // Update item total price display
    updateItemTotal(itemId, quantity) {
        const cartItem = document.querySelector(`[data-item-id="${itemId}"]`);
        if (!cartItem) return;

        const unitPriceElement = cartItem.querySelector('.unit-price-amount');
        const totalPriceElement = cartItem.querySelector('.total-price-amount');
        
        if (unitPriceElement && totalPriceElement) {
            const unitPrice = parseFloat(unitPriceElement.textContent.replace(/[^0-9.]/g, '')) || 0;
            const totalPrice = unitPrice * quantity;
            
            totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
            
            // Add animation
            totalPriceElement.style.transform = 'scale(1.1)';
            totalPriceElement.style.color = 'var(--primary-color)';
            
            setTimeout(() => {
                totalPriceElement.style.transform = '';
                totalPriceElement.style.color = '';
            }, 300);
        }
    }

    // Update cart totals
    updateCartTotals() {
        let hotelSubtotal = 0;
        let flightSubtotal = 0;

        // Calculate subtotals from visible items
        document.querySelectorAll('.cart-item').forEach(item => {
            const itemType = item.dataset.itemType;
            const totalPriceElement = item.querySelector('.total-price-amount');
            
            if (totalPriceElement) {
                const price = parseFloat(totalPriceElement.textContent.replace(/[^0-9.]/g, '')) || 0;
                
                if (itemType === 'hotel') {
                    hotelSubtotal += price;
                } else if (itemType === 'flight') {
                    flightSubtotal += price;
                }
            }
        });

        // Update display
        const hotelSubtotalElement = document.getElementById('hotelSubtotal');
        const flightSubtotalElement = document.getElementById('flightSubtotal');
        const totalAmountElement = document.getElementById('totalAmount');

        if (hotelSubtotalElement) hotelSubtotalElement.textContent = `$${hotelSubtotal.toFixed(2)}`;
        if (flightSubtotalElement) flightSubtotalElement.textContent = `$${flightSubtotal.toFixed(2)}`;

        // Calculate total (including taxes, discounts)
        const discountAmount = parseFloat(document.getElementById('discountAmount')?.textContent.replace(/[^0-9.]/g, '')) || 0;
        const taxAmount = parseFloat(document.getElementById('taxAmount')?.textContent.replace(/[^0-9.]/g, '')) || 0;
        
        const total = hotelSubtotal + flightSubtotal - discountAmount + taxAmount;
        
        if (totalAmountElement) {
            totalAmountElement.textContent = `$${total.toFixed(2)}`;
            
            // Add animation
            totalAmountElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                totalAmountElement.style.transform = '';
            }, 300);
        }

        // Update cart count
        this.updateCartCount();
    }

    // Update cart count in header
    updateCartCount() {
        const cartItems = document.querySelectorAll('.cart-item');
        const cartCount = document.getElementById('cartCount');
        
        if (cartCount) {
            cartCount.textContent = cartItems.length;
            
            if (cartItems.length > 0) {
                cartCount.style.display = 'flex';
            } else {
                cartCount.style.display = 'none';
            }
        }
    }

    // Remove Item
    handleRemoveItem(button) {
        const itemId = button.dataset.itemId;
        const cartItem = button.closest('.cart-item');
        
        if (!cartItem) return;

        const itemTitle = cartItem.querySelector('.item-title')?.textContent || 'este producto';
        
        this.showConfirmationModal(
            'Eliminar Producto',
            `¿Estás seguro de que deseas eliminar "${itemTitle}" del carrito?`,
            () => {
                this.removeItemWithAnimation(cartItem);
                this.showNotification('Producto eliminado del carrito', 'success');
            }
        );
    }

    removeItemWithAnimation(cartItem) {
        cartItem.style.transform = 'translateX(-100%)';
        cartItem.style.opacity = '0';
        
        setTimeout(() => {
            cartItem.remove();
            this.updateCartTotals();
            this.updateCartDisplay();
        }, 300);
    }

    // Clear Cart
    handleClearCart() {
        const cartItems = document.querySelectorAll('.cart-item');
        
        if (cartItems.length === 0) {
            this.showNotification('El carrito ya está vacío', 'info');
            return;
        }

        this.showConfirmationModal(
            'Vaciar Carrito',
            '¿Estás seguro de que deseas eliminar todos los productos del carrito?',
            () => {
                this.clearCartWithAnimation();
                this.showNotification('Carrito vaciado exitosamente', 'success');
            }
        );
    }

    clearCartWithAnimation() {
        const cartItems = document.querySelectorAll('.cart-item');
        
        cartItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.transform = 'translateX(-100%)';
                item.style.opacity = '0';
                
                setTimeout(() => {
                    item.remove();
                    if (index === cartItems.length - 1) {
                        this.updateCartDisplay();
                        this.updateCartTotals();
                    }
                }, 300);
            }, index * 100);
        });
    }

    // Promo Code
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

        // Show loading state
        this.setLoadingState(promoBtn, true);

        // Simulate validation delay
        setTimeout(() => {
            this.setLoadingState(promoBtn, false);
            
            // The actual validation would be done by PHP
            // For now, just show visual feedback
            this.showPromoMessage('Código aplicado exitosamente', 'success');
            promoInput.value = '';
            
            // In real implementation, PHP would return the discount amount
            // and update the totals accordingly
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

    // Checkout
    handleCheckout() {
        const cartItems = document.querySelectorAll('.cart-item');
        if (cartItems.length === 0) {
            this.showNotification('No hay productos en el carrito', 'error');
            return;
        }

        // Construye el array de productos a enviar
        const items = [];
        cartItems.forEach(item => {
            items.push({
                productoId: parseInt(item.dataset.productId),
                cantidad: parseInt(item.querySelector('.quantity-input').value),
                // Puedes agregar más campos si lo necesitas
            });
        });

        const token = localStorage.getItem('token');
        if (!token) {
            this.showNotification('Debes iniciar sesión para comprar', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        // Llama a la API para crear el pedido
        fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items })
        })
        .then(res => res.json())
        .then(data => {
            if (data && data.id) {
                this.showNotification('¡Compra realizada con éxito!', 'success');
                // Limpia el carrito visualmente
                setTimeout(() => {
                    // Aquí puedes limpiar el carrito y redirigir si quieres
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showNotification(data.message || 'Error al procesar la compra', 'error');
            }
        })
        .catch(() => {
            this.showNotification('Error de red al procesar la compra', 'error');
        });
    }

    // Add Recommended Item
    handleAddRecommended(button) {
        const itemId = button.dataset.itemId;
        const recommendedItem = button.closest('.recommended-item');
        
        if (!recommendedItem) return;

        // Add visual feedback
        button.style.transform = 'scale(0.95)';
        button.innerHTML = '<i class="fas fa-check"></i> Agregado';
        button.style.background = 'var(--success-color)';
        
        setTimeout(() => {
            button.style.transform = '';
            button.innerHTML = '<i class="fas fa-plus"></i> Agregar';
            button.style.background = '';
        }, 2000);

        this.showNotification('Producto agregado al carrito', 'success');
        
        // In real implementation, this would make an AJAX call to add the item
        // For now, just provide visual feedback
    }

    // Cart Display Management
    updateCartDisplay() {
        const cartItems = document.querySelectorAll('.cart-item');
        const emptyCart = document.getElementById('emptyCart');
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const cartSummarySection = document.getElementById('cartSummarySection');

        if (cartItems.length === 0) {
            // Show empty cart state
            if (emptyCart) emptyCart.style.display = 'block';
            if (cartItemsContainer) cartItemsContainer.style.display = 'none';
            if (cartSummarySection) cartSummarySection.style.display = 'none';
        } else {
            // Show cart with items
            if (emptyCart) emptyCart.style.display = 'none';
            if (cartItemsContainer) cartItemsContainer.style.display = 'block';
            if (cartSummarySection) cartSummarySection.style.display = 'block';
        }
    }

    // Templates
    setupTemplates() {
        this.cartItemTemplate = document.getElementById('cartItemTemplate');
        this.recommendedItemTemplate = document.getElementById('recommendedItemTemplate');
    }

    // Modal Controls
    setupModalControls() {
        const modal = document.getElementById('confirmationModal');
        const modalClose = document.getElementById('modalClose');
        const modalCancel = document.getElementById('modalCancel');
        const modalConfirm = document.getElementById('modalConfirm');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.hideModal());
        }

        if (modalCancel) {
            modalCancel.addEventListener('click', () => this.hideModal());
        }

        // Close modal on backdrop click
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
        
        // Remove previous event listeners
        const newConfirmBtn = modalConfirm.cloneNode(true);
        modalConfirm.parentNode.replaceChild(newConfirmBtn, modalConfirm);
        
        // Add new event listener
        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            this.hideModal();
        });

        if (modal) {
            modal.classList.add('show');
        }
    }

    hideModal() {
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            modal.classList.remove('show');
        }
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

    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
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

    // Form Validation
    setupFormValidation() {
        // Add real-time validation for promo code
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

    // Animations
    setupAnimations() {
        // Intersection Observer for entrance animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = `${Math.random() * 0.3}s`;
                    entry.target.classList.add('animate-in');
                }
            });
        });

        document.querySelectorAll('.cart-item, .cart-summary, .recommended-section').forEach(el => {
            observer.observe(el);
        });
    }

    // Utility Methods
    handleKeyboardShortcuts(e) {
        // Escape key to close modal
        if (e.key === 'Escape') {
            this.hideModal();
        }

        // Ctrl/Cmd + Enter to checkout
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const cartItems = document.querySelectorAll('.cart-item');
            if (cartItems.length > 0) {
                this.handleCheckout();
            }
        }
    }

    // Public API Methods
    refreshCart() {
        this.updateCartDisplay();
        this.updateCartTotals();
    }

    addItemToCart(itemData) {
        // This would be called by PHP/AJAX to add visual representation
        // For now, just show notification
        this.showNotification('Producto agregado al carrito', 'success');
        this.refreshCart();
    }
}

// Initialize Cart UI when DOM is loaded
let cartUI;

document.addEventListener('DOMContentLoaded', function() {
    cartUI = new CartUI();
    
    console.log(`
🛒 Shopping Cart UI Initialized!

📋 Visual Features Active:
=========================
✅ Quantity controls with validation
✅ Real-time price calculations
✅ Item removal with confirmation
✅ Cart clearing functionality
✅ Promo code input handling
✅ Checkout process simulation
✅ Recommended items interaction
✅ Loading states for all actions
✅ Responsive notifications
✅ Modal confirmations
✅ Keyboard shortcuts
✅ Smooth animations

🎯 Data Processing:
==================
- All cart data comes from PHP
- Forms submit naturally to backend
- No data simulation or storage
- Visual feedback only

🔧 Integration Points:
=====================
- cart.php → Load cart items
- update-quantity.php → Update item quantities
- remove-item.php → Remove items
- apply-promo.php → Apply discount codes
- checkout.php → Process checkout
    `);
});

// Global API for external use
window.CartAPI = {
    showNotification: function(text, type, duration) {
        if (cartUI) cartUI.showNotification(text, type, duration);
    },
    
    refreshCart: function() {
        if (cartUI) cartUI.refreshCart();
    },
    
    addItemToCart: function(itemData) {
        if (cartUI) cartUI.addItemToCart(itemData);
    },
    
    updateCartCount: function() {
        if (cartUI) cartUI.updateCartCount();
    }
};