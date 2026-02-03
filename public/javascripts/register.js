
const form = document.getElementById('registerForm');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('emailError');

function togglePassword(fieldId, el) {
    const passwordInput = document.getElementById(fieldId);
    const icon = el.querySelector('i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

emailInput.addEventListener('blur', () => {
  if (emailInput.validity.typeMismatch || emailInput.value === '') {
    emailError.style.display = 'block';
  } else {
    emailError.style.display = 'none';
  }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const twoFactor = document.getElementById('twoFactor').checked;

    if (password !== confirmPassword) {
        errorMsg.textContent = 'Las contraseñas no coinciden';
        errorMsg.style.display = 'block';
        return;
    }

    if (password.length < 8) {
        errorMsg.textContent = 'La contraseña debe tener al menos 8 caracteres';
        errorMsg.style.display = 'block';
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>Registrando...';

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password,
                two_factor: twoFactor
            })
        });

        const data = await response.json();

        if (response.ok) {
            successMsg.textContent = 'Cuenta creada exitosamente. Redirigiendo al login...';
            successMsg.style.display = 'block';
            setTimeout(() => {
                window.location.href = '/auth/login';
            }, 2000);
        } else {
            errorMsg.textContent = data.error || 'Error al registrarse';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        errorMsg.textContent = 'Error de conexión. Intenta de nuevo.';
        errorMsg.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Registrarse';
    }
});

// Validar disponibilidad de usuario en tiempo real
document.getElementById('username').addEventListener('blur', async (e) => {
    const username = e.target.value.trim();
    if (username.length < 3) return;

    try {
        const response = await fetch(`/auth/check-username?username=${encodeURIComponent(username)}`);
        const data = await response.json();
        if (!data.available) {
            errorMsg.textContent = 'Este usuario ya está en uso';
            errorMsg.style.display = 'block';
        } else {
            errorMsg.style.display = 'none';
        }
    } catch (error) {
        console.error('Error verificando usuario:', error);
    }
});

// Validar disponibilidad de email en tiempo real
document.getElementById('email').addEventListener('blur', async (e) => {
    const email = e.target.value.trim();
    if (!email.includes('@')) return;

    try {
        const response = await fetch(`/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        if (!data.available) {
            errorMsg.textContent = 'Este email ya está registrado';
            errorMsg.style.display = 'block';
        } else {
            errorMsg.style.display = 'none';
        }
    } catch (error) {
        console.error('Error verificando email:', error);
    }
});
