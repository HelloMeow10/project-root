// frontend/js/verificar-email.js
document.addEventListener('DOMContentLoaded', function() {
    const resendButton = document.getElementById('resendVerificationEmailBtn');
    const messageContainer = document.getElementById('messageContainer');

    function showMessage(message, type = 'info') {
        messageContainer.textContent = message;
        if (type === 'success') {
            messageContainer.style.color = 'green';
        } else if (type === 'error') {
            messageContainer.style.color = 'red';
        } else {
            messageContainer.style.color = 'black'; // Default color
        }
    }

    // Verificar si el email ya está verificado al cargar la página
    const isVerified = localStorage.getItem('verificado') === 'true';
    if (isVerified) {
        showMessage('Tu email ya ha sido verificado. Puedes cerrar esta página o ir a iniciar sesión.', 'success');
        resendButton.disabled = true;
        resendButton.style.opacity = '0.5';
    }

    resendButton.addEventListener('click', async function() {
        if (localStorage.getItem('verificado') === 'true') {
            showMessage('Tu email ya ha sido verificado.', 'success');
            resendButton.disabled = true;
            resendButton.style.opacity = '0.5';
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Debes estar logueado para reenviar el correo de verificación. Por favor, inicia sesión.', 'error');
            // Opcional: redirigir a login después de un momento
            // setTimeout(() => window.location.href = 'login.html', 3000);
            return;
        }

        showMessage('Reenviando correo de verificación...', 'info');
        resendButton.disabled = true;

        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Correo de verificación reenviado con éxito. Revisa tu bandeja de entrada (y spam).', 'success');
            } else {
                showMessage(data.message || 'Error al reenviar el correo. Inténtalo de nuevo más tarde.', 'error');
            }
        } catch (error) {
            console.error('Error al reenviar el correo:', error);
            showMessage('Ocurrió un error de red. Por favor, revisa tu conexión e inténtalo de nuevo.', 'error');
        } finally {
            // Habilitar el botón después de un corto periodo para evitar spam,
            // a menos que el email ya esté verificado.
            if (localStorage.getItem('verificado') !== 'true') {
                 setTimeout(() => {
                    resendButton.disabled = false;
                }, 5000); // Espera 5 segundos antes de permitir otro reenvío
            }
        }
    });

    // Manejar el token de verificación de la URL (si es que esta página también lo hace)
    // La lógica actual del backend redirige directamente a verificacion-exitosa.html,
    // por lo que esta parte podría no ser estrictamente necesaria aquí si la única
    // forma de llegar a la verificación es a través del enlace del correo.
    // Si esta página *también* puede procesar un token (ej. ?token=XYZ), se necesitaría esa lógica.
    // Por ahora, se asume que esta página es solo informativa y para reenvío.
});
