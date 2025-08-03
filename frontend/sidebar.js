firebase.initializeApp(firebaseConfig);

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const main    = document.getElementById('main-content');
  const toggle  = document.getElementById('sidebar-toggle');
  const avatar  = document.getElementById('avatar-mira');

  // Sidebar: inicia expandido
  sidebar.classList.add('expanded');
  sidebar.classList.remove('mini');
  main.style.marginLeft = getSidebarWidth() + 'px';

  // Toggle sidebar (expandido <-> mini)
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('mini');
    sidebar.classList.toggle('expanded');
    main.style.marginLeft = getSidebarWidth() + 'px';
    toggle.innerText = sidebar.classList.contains('mini') ? '⮞' : '⮜';
  });

  // Devuelve el ancho actual del sidebar
  function getSidebarWidth() {
    return sidebar.classList.contains('mini') ? 56 : 260;
  }

  // Abrir panel (solo uno abierto a la vez)
  window.openPanel = (panelId) => {
    document.querySelectorAll('.accordion-panel').forEach(panel => {
      panel.classList.remove('open');
    });
    document.getElementById(panelId).querySelector('.accordion-panel').classList.add('open');
    // Si estaba en mini, expande el sidebar
    if (sidebar.classList.contains('mini')) {
      sidebar.classList.remove('mini');
      sidebar.classList.add('expanded');
      main.style.marginLeft = getSidebarWidth() + 'px';
      toggle.innerText = '⮜';
    }
  };

  // Actualiza datos usuario en panel "usuario"
  firebase.auth().onAuthStateChanged(user => {
    if (!user) return window.location.href = 'login.html';
    document.getElementById('user-info').innerHTML = `
      <div><strong>${user.displayName || user.email}</strong></div>
      <div class="user-email">${user.email}</div>
    `;
  });

  // Avatar IA flotante: draggable
  if (avatar) {
    let drag = false, offsetX = 0, offsetY = 0;

    avatar.style.position = 'fixed';
    avatar.style.left = 'calc(100vw - 160px)';
    avatar.style.bottom = '48px';

    // Mouse
    avatar.addEventListener('mousedown', (e) => {
      drag = true;
      offsetX = e.clientX - avatar.offsetLeft;
      offsetY = e.clientY - avatar.offsetTop;
      avatar.style.cursor = 'grabbing';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!drag) return;
      avatar.style.left = (e.clientX - offsetX) + 'px';
      avatar.style.top  = (e.clientY - offsetY) + 'px';
    });
    document.addEventListener('mouseup', () => {
      if (drag) {
        drag = false;
        avatar.style.cursor = 'grab';
      }
    });
    // Touch (móviles/tablet)
    avatar.addEventListener('touchstart', (e) => {
      drag = true;
      const touch = e.touches[0];
      offsetX = touch.clientX - avatar.offsetLeft;
      offsetY = touch.clientY - avatar.offsetTop;
      avatar.style.cursor = 'grabbing';
    });
    document.addEventListener('touchmove', (e) => {
      if (!drag) return;
      const touch = e.touches[0];
      avatar.style.left = (touch.clientX - offsetX) + 'px';
      avatar.style.top  = (touch.clientY - offsetY) + 'px';
    });
    document.addEventListener('touchend', () => {
      if (drag) {
        drag = false;
        avatar.style.cursor = 'grab';
      }
    });
  }
});

// Logout global
window.logout = () => {
  firebase.auth().signOut().then(() => location.href = 'login.html');
};

// Animación de avatar al hablar (sin brillo)
window.avatarSpeaking = function () {
  const avatar = document.getElementById('avatar-mira');
  if (!avatar) return;
  avatar.classList.add('speaking');
  setTimeout(() => avatar.classList.remove('speaking'), 480);
};
