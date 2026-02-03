
 
    const form = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');

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

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg.style.display = 'none';
      successMsg.style.display = 'none';

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const remember = document.getElementById('remember').checked;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span>Iniciando sesión...';

      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            email,
            password,
            remember_me: remember
          })
        });

        const data = await response.json();

        if (response.ok) {
           
          successMsg.textContent = 'Sesión iniciada. Redirigiendo...';
          successMsg.style.display = 'block';
          setTimeout(() => {
            window.location.href = '/auth/me';
          }, 1500);
        } else {
          errorMsg.textContent = data.error || 'Error al iniciar sesión';
          errorMsg.style.display = 'block';
        }
      } catch (error) {
        errorMsg.textContent = 'Error de conexión. Intenta de nuevo.';
        errorMsg.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Iniciar sesión';
      }
    });
    
