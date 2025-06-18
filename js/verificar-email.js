// verificar-email.js

document.addEventListener('DOMContentLoaded', function() {
  const verifyForm = document.getElementById('verifyForm');
  const verificationCode = document.getElementById('verificationCode');
  const resendBtn = document.getElementById('resendBtn');
  const verifyMessage = document.getElementById('verifyMessage');

  function showMessage(msg, type = 'info') {
    verifyMessage.textContent = msg;
    verifyMessage.style.color = type === 'success' ? '#28a745' : (type === 'error' ? '#c00' : '#555');
  }

  async function verifyToken(token) {
    if (!token) {
      showMessage('Ingresa el código de verificación.', 'error');
      return;
    }
    showMessage('Verificando...', 'info');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('¡Email verificado correctamente! Ahora puedes usar el carrito.', 'success');
        setTimeout(() => window.location.href = 'carrito.html', 2000);
      } else {
        showMessage(data.message || 'Código inválido o expirado.', 'error');
      }
    } catch (err) {
      showMessage('Error de red. Intenta de nuevo.', 'error');
    }
  }

  // Detectar token en la URL
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  if (urlToken) {
    verificationCode.value = urlToken;
    verifyForm.style.display = 'none'; // Oculta el formulario manual
    resendBtn.style.display = 'none';
    showMessage('Verificando automáticamente...', 'info');
    verifyToken(urlToken);
    return;
  } else {
    verifyForm.style.display = '';
    resendBtn.style.display = '';
  }

  verifyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const code = verificationCode.value.trim();
    verifyToken(code);
  });

  resendBtn.addEventListener('click', async function() {
    showMessage('Reenviando email...', 'info');
    const token = localStorage.getItem('token');
    if (!token) {
      showMessage('Debes iniciar sesión para reenviar el email.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        showMessage('Email de verificación reenviado. Revisa tu bandeja de entrada.', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage(data.message || 'No se pudo reenviar el email.', 'error');
      }
    } catch (err) {
      showMessage('Error al reenviar el email.', 'error');
    }
  });
});
