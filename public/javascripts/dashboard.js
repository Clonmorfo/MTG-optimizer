(async function(){
  const usernameEl = document.getElementById('username');
  const emailEl = document.getElementById('email');
  const avatarEl = document.getElementById('avatar');
  const roleBadge = document.getElementById('roleBadge');
  const roleNum = document.getElementById('roleNum');
  const roleText = document.getElementById('roleText');
  const welcome = document.getElementById('welcome');
  const btnLogout = document.getElementById('btnLogout');

  function mapRole(roleStr){
    // Mapea texto a número según convención solicitada
    // 0 = user, 1 = operator, 2 = admin, 3 = owner
    switch((roleStr||'').toLowerCase()){
      case 'operator': return {num:1,text:'OPERATOR',class:'role-operator'};
      case 'admin': return {num:2,text:'ADMIN',class:'role-admin'};
      case 'owner': return {num:3,text:'OWNER',class:'role-owner'};
      default: return {num:0,text:'USER',class:'role-user'};
    }
  }

  async function fetchMe(){
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // No token: redirect to login
      window.location.href = '/user/login.html';
      return;
    }

    try {
      const res = await fetch('/auth/me', {
        headers: { 'Authorization': 'Bearer ' + token },
        credentials: 'include'
      });

      if (!res.ok) {
        // token invalid or expired => redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/user/login.html';
        return;
      }

      const data = await res.json();
      const { username, email, role, roleName } = data;

      usernameEl.textContent = username || 'Usuario';
      emailEl.textContent = email || '';
      avatarEl.textContent = (username||'U').charAt(0).toUpperCase();
      welcome.textContent = `Bienvenido, ${username || 'Usuario'}.`;

      roleNum.textContent = role;
      roleText.textContent = roleName;

      const mapped = mapRole(roleName || 'user');
      roleBadge.textContent = mapped.text;
      roleBadge.className = 'role-badge ' + mapped.class;

    } catch (err) {
      console.error('Error fetching /auth/me', err);
      localStorage.removeItem('accessToken');
      window.location.href = '/user/login.html';
    }
  }

  btnLogout.addEventListener('click', ()=>{
    // Simple logout: clear token and go to login
    localStorage.removeItem('accessToken');
    // Optionally clear refresh cookie by calling a logout endpoint (not implemented)
    window.location.href = '/user/login.html';
  });

  // Load user data
  fetchMe();

})();
