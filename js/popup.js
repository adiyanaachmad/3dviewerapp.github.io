
document.addEventListener("DOMContentLoaded", function () {
  const openSettingBtn = document.getElementById("openSettingBtn");
  const cardWrapper = document.getElementById("cardWrapper");

  const allCardContainers = document.querySelectorAll(".card-container-desktop");

  const openBtn = document.getElementById("openSettingDasboard");
  const closeButtons = document.querySelectorAll(".close-btn-lr");

  const panelSetting = document.querySelector(".panel-setting");
  const panelSettingInfo = document.querySelector(".panel-setting-info");
  const panelSettingAdvance = document.getElementById("panelSettingAdvance");

  let isAdvanceOpen = false;

  function handleResponsivePanel() {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      cardWrapper.style.opacity = "1";
      cardWrapper.style.pointerEvents = "auto";
      cardWrapper.style.display = "flex";

      panelSettingInfo.style.display = "none";
      panelSettingInfo.classList.remove("panel-active");
    } else {
      panelSettingInfo.style.display = "block";
      requestAnimationFrame(() => {
        panelSettingInfo.classList.add("panel-active");
      });

      cardWrapper.style.opacity = "0";
      cardWrapper.style.pointerEvents = "none";
      setTimeout(() => {
        cardWrapper.style.display = "none";
      }, 600);
    }
  }

  function handleResponsiveAdvancePanel(forceClose = false) {
    const isDesktop = window.innerWidth >= 768;

    if (forceClose) {
      panelSettingAdvance.classList.remove("panel-active");
      setTimeout(() => {
        panelSettingAdvance.style.display = "none";
      }, 600);
      isAdvanceOpen = false;
    } else if (!isDesktop) {
      panelSettingAdvance.classList.remove("panel-active");
      setTimeout(() => {
        panelSettingAdvance.style.display = "none";
      }, 600);
    } else if (isDesktop && isAdvanceOpen) {
      panelSettingAdvance.style.display = "block";
      requestAnimationFrame(() => {
        panelSettingAdvance.classList.add("panel-active");
      });
    }
  }

  const panels = {
    mesh: {
      container: document.querySelector(".card-mesh"),
      toggleBtn: document.getElementById("meshDataVisible"),
      icon: document.getElementById("meshDataVisible").querySelector("i"),
      isExpanded: false
    },
    bloom: {
      container: document.querySelector(".bloom-card-container"),
      toggleBtn: document.getElementById("meshDataVisibleBloom"),
      icon: document.getElementById("meshDataVisibleBloom").querySelector("i"),
      isExpanded: false
    },
    camera: {
      container: document.querySelector(".camera-card-container"),
      toggleBtn: document.getElementById("cameraVisible"),
      icon: document.getElementById("cameraVisible").querySelector("i"),
      isExpanded: false
    },
    material: {
      container: document.querySelector(".material-card-container"),
      toggleBtn: document.getElementById("materialVisible"),
      icon: document.getElementById("materialVisible").querySelector("i"),
      isExpanded: false
    }
  };

  function collapsePanel(key) {
    const panel = panels[key];
    panel.container.style.height = "30px";
    panel.icon.classList.remove("fa-minus");
    panel.icon.classList.add("fa-plus");
    panel.isExpanded = false;
  }

  function expandPanel(key) {
    const panel = panels[key];

    let height = "465px";
    if (key === "camera") height = "165px";
    if (key === "material") height = "180px";
    if (key === "bloom") height = "440px";

    panel.container.style.height = height;
    panel.icon.classList.remove("fa-plus");
    panel.icon.classList.add("fa-minus");
    panel.isExpanded = true;
  }


  function togglePanel(activeKey) {
    const panel = panels[activeKey];
    const wasExpanded = panel.isExpanded;

    // Collapse all panels except the one being toggled
    Object.keys(panels).forEach((key) => {
      if (key !== activeKey) {
        collapsePanel(key);
      }
    });

    if (wasExpanded) {
      collapsePanel(activeKey);
    } else {
      expandPanel(activeKey);
    }

    // Check after state change to show/hide card-containers
    setTimeout(() => {
      const allCollapsed = Object.values(panels).every(p => !p.isExpanded);
      if (allCollapsed) {
        allCardContainers.forEach(c => {
          c.style.display = "grid";
          setTimeout(() => {
            c.classList.remove("hidden");
          }, 10);
        });
      } else {
        allCardContainers.forEach(c => {
          c.classList.add("hidden");
          setTimeout(() => {
            c.style.display = "none";
          }, 400);
        });
      }
    }, 20);
  }

  panels.mesh.toggleBtn.addEventListener("click", () => togglePanel("mesh"));
  panels.bloom.toggleBtn.addEventListener("click", () => togglePanel("bloom"));
  panels.camera.toggleBtn.addEventListener("click", () => togglePanel("camera"));
  panels.material.toggleBtn.addEventListener("click", () => togglePanel("material"));

  openBtn.addEventListener("click", () => {
    panelSetting.style.display = "block";
    isAdvanceOpen = true;

    handleResponsivePanel();
    handleResponsiveAdvancePanel();

    toggleCreditInfo(false);

    requestAnimationFrame(() => {
      panelSetting.classList.add("panel-active");
    });
  });

  closeButtons.forEach(button => {
    button.addEventListener("click", () => {
      panelSetting.classList.remove("panel-active");
      panelSettingInfo.classList.remove("panel-active");
      panelSettingAdvance.classList.remove("panel-active");

      toggleCreditInfo(true);

      cardWrapper.style.opacity = "0";
      cardWrapper.style.pointerEvents = "none";

      setTimeout(() => {
        panelSetting.style.display = "none";
        panelSettingInfo.style.display = "none";
        panelSettingAdvance.style.display = "none";
        cardWrapper.style.display = "none";
      }, 600);

      isAdvanceOpen = false;
    });
  });

  window.addEventListener("resize", () => {
    if (panelSetting.classList.contains("panel-active")) {
      handleResponsivePanel();
      handleResponsiveAdvancePanel();
    }
  });

  let isCardWrapperVisible = false;
  openSettingBtn?.addEventListener("click", () => {
    isCardWrapperVisible = !isCardWrapperVisible;
    cardWrapper.style.opacity = isCardWrapperVisible ? "1" : "0";
    cardWrapper.style.pointerEvents = isCardWrapperVisible ? "auto" : "none";
    if (isCardWrapperVisible) {
      cardWrapper.style.display = "flex";
    } else {
      setTimeout(() => {
        cardWrapper.style.display = "none";
      }, 600);
    }
  });
});

function toggleCreditInfo(show = true) {
  const creditInfo = document.querySelector(".credit-info");
  if (!creditInfo) return;

  if (show) {
    creditInfo.classList.remove("hidden");
  } else {
    creditInfo.classList.add("hidden");
  }
}

let i = 0;
let blocks = document.querySelectorAll(".block-loader");
const interval = setInterval(() => {
  if (i == blocks.length) {
    i = 0;
    blocks.forEach((block) => {
      block.style.background = "transparent";
    });
  } else if (blocks[i]) {
    blocks[i].style.background = "rgb(255,255,0)";
    i = i + 1;
  }
}, 250);

// Fungsi untuk menutup popup yang terbuka
function closePopup(popup) {
    popup.classList.remove('show');
    popup.classList.add('hide');
    popup.style.display = 'none';
}

// Fungsi untuk membuka popup
function openPopup(popup) {
    popup.style.display = 'flex';
    setTimeout(() => {
        popup.classList.remove('hide');
        popup.classList.add('show');
    }, 10);
}

// Fungsi untuk menutup popup yang terbuka
function closePopup(popup) {
    popup.classList.remove('show');
    popup.classList.add('hide');
    popup.style.display = 'none';
}

// Fungsi untuk membuka popup
function openPopup(popup) {
    popup.style.display = 'flex';
    setTimeout(() => {
        popup.classList.remove('hide');
        popup.classList.add('show');
    }, 10);
}

const effect = document.querySelector('.effect');
const lineEffect = document.querySelector('.line-effect');
const buttons = document.querySelectorAll('.bottom-navbar button:not(.plus)');
const toggleMbgButton = document.getElementById('toggleMbg'); // Tombol untuk membuka/menutup toggleMbg
const toggleMbgPopup = document.getElementById('popup1'); // Popup toggleMbg

// Fungsi untuk menghapus class active-bottom dari semua tombol
function removeActiveBottom() {
  buttons.forEach(button => {
    button.classList.remove('active-bottom');
    button.style.backgroundColor = '';  // Kembalikan warna tombol semula
  });
}

function removeActiveFree() {
  const toggleSkjButton = document.getElementById('toggleSkj');
  if (toggleSkjButton) {
    toggleSkjButton.classList.remove('active-free');
    toggleSkjButton.style.backgroundColor = ''; // kembalikan warna default
  }
}

function removeActiveFreeAni() {
  const toggleAniButton = document.getElementById('toggleAni');
  if (toggleAniButton) {
    toggleAniButton.classList.remove('active-free');
    toggleAniButton.style.backgroundColor = ''; // kembalikan warna default
  }
}



// Event listener untuk tombol-tombol yang ada di navbar
buttons.forEach(button => {
  button.addEventListener('click', e => {
    const x = e.target.getBoundingClientRect().left;
    const width = e.target.offsetWidth;

    // Hapus class active-bottom dari semua tombol
    removeActiveBottom();

    // Menambahkan class active-bottom pada tombol yang diklik
    e.target.classList.add('active-bottom');

  });
});

function closeAllPopups() {
    const popups = [document.getElementById('popup2'), document.getElementById('popup3'), document.getElementById('popup4'), document.getElementById('popup5'),  document.getElementById('popup6'), document.getElementById('popup7')];

    popups.forEach(popup => {
        if (popup.classList.contains('show')) {
            closePopup(popup);
        }
    });
}

// Event listener untuk toggleMbg
toggleMbgButton.addEventListener('click', function() {
    const popup = toggleMbgPopup;
    const button = toggleMbgButton;
    const icon = document.getElementById('toggleFolder'); 

    // Menutup seluruh popup yang sedang terlihat
    closeAllPopups();

    // Cek apakah popup toggleMbg masih terbuka
    if (popup.classList.contains('show')) {
        // Menutup popup toggleMbg
        popup.classList.remove('show');
        popup.classList.add('hide');
        popup.style.display = 'none';
        button.style.marginTop = '-50px';
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-folder');

        // Menghapus class active-bottom saat toggleMbg ditutup
        removeActiveBottom();
    } else {
        // Membuka popup toggleMbg
        popup.style.display = 'flex';
        setTimeout(() => {
            popup.classList.remove('hide');
            popup.classList.add('show');
        }, 10);
        button.style.marginTop = '0px';
        icon.classList.remove('fa-folder'); 
        icon.classList.add('fa-xmark'); 

        // Menghapus class active-bottom saat toggleMbg dibuka
        removeActiveBottom();
    }
    removeActiveFree();
    removeActiveFreeAni(); 
}); 

document.getElementById('toggleChart').addEventListener('click', function() {
    const popup = document.getElementById('popup2');
    const toggleMbgPopup = document.getElementById('popup1');
    const toggleBmPopup = document.getElementById('popup3');
    const toggleCamePopup = document.getElementById('popup4'); 
    const toggleMatePopup = document.getElementById('popup5');
    const toggleSkjPopup = document.getElementById('popup6');
    const toggleAniPopup = document.getElementById('popup7');

    // Cek apakah toggleMbg masih terbuka
    if (toggleMbgPopup.classList.contains('show')) {
        return; // Jika toggleMbg terbuka, hentikan eksekusi dan tidak membuka popup lain
    }

    // Menutup popup lain jika terbuka
    if (toggleBmPopup.classList.contains('show')) {
        closePopup(toggleBmPopup);
    }
    if (toggleMatePopup.classList.contains('show')) {
        closePopup(toggleMatePopup);
    }
    if (toggleSkjPopup.classList.contains('show')) {
        closePopup(toggleSkjPopup);
    }
    if (toggleAniPopup.classList.contains('show')) {
        closePopup(toggleAniPopup);
    }

    // Menutup popup toggleCame jika terbuka
    if (toggleCamePopup.classList.contains('show')) {
        closePopup(toggleCamePopup);
    }

    if (popup.classList.contains('show')) {
        // Menutup popup toggleChart jika sudah terbuka
        closePopup(popup, () => {
            // Panggil removeActiveBottom setelah popup ditutup
            removeActiveBottom();
        });
    } else {
        // Membuka popup toggleChart
        openPopup(popup);
    }
    removeActiveFree();
    removeActiveFreeAni(); 
});

document.getElementById('toggleBm').addEventListener('click', function() {
    const popup = document.getElementById('popup3');
    const toggleMbgPopup = document.getElementById('popup1');
    const toggleChartPopup = document.getElementById('popup2');
    const toggleCamePopup = document.getElementById('popup4'); 
    const toggleMatePopup = document.getElementById('popup5');
    const toggleSkjPopup = document.getElementById('popup6');
    const toggleAniPopup = document.getElementById('popup7');

    // Cek apakah toggleMbg masih terbuka
    if (toggleMbgPopup.classList.contains('show')) {
        return; // Jika toggleMbg terbuka, hentikan eksekusi dan tidak membuka popup lain
    }

    // Menutup popup lain jika terbuka
    if (toggleChartPopup.classList.contains('show')) {
        closePopup(toggleChartPopup);
    }
    if (toggleMatePopup.classList.contains('show')) {
        closePopup(toggleMatePopup);
    }
    if (toggleSkjPopup.classList.contains('show')) {
        closePopup(toggleSkjPopup);
    }
    if (toggleAniPopup.classList.contains('show')) {
        closePopup(toggleAniPopup);
    }

    // Menutup popup toggleCame jika terbuka
    if (toggleCamePopup.classList.contains('show')) {
        closePopup(toggleCamePopup);
    }

    if (popup.classList.contains('show')) {
        // Menutup popup toggleBm jika sudah terbuka
        closePopup(popup, () => {
            // Panggil removeActiveBottom setelah popup ditutup
            removeActiveBottom();
        });
    } else {
        // Membuka popup toggleBm
        openPopup(popup);
    }
    removeActiveFree();
    removeActiveFreeAni(); 
});

document.getElementById('toggleCame').addEventListener('click', function() {
    const popup = document.getElementById('popup4');
    const toggleMbgPopup = document.getElementById('popup1');
    const toggleChartPopup = document.getElementById('popup2');
    const toggleBmPopup = document.getElementById('popup3');
    const toggleMatePopup = document.getElementById('popup5');
    const toggleSkjPopup = document.getElementById('popup6');
    const toggleAniPopup = document.getElementById('popup7');

    // Cek apakah toggleMbg masih terbuka
    if (toggleMbgPopup.classList.contains('show')) {
        return; // Jika toggleMbg terbuka, hentikan eksekusi dan tidak membuka popup lain
    }

    // Menutup popup lain jika terbuka
    if (toggleChartPopup.classList.contains('show')) {
        closePopup(toggleChartPopup);
    }
    if (toggleBmPopup.classList.contains('show')) {
        closePopup(toggleBmPopup);
    }
    if (toggleMatePopup.classList.contains('show')) {
        closePopup(toggleMatePopup);
    }
    if (toggleSkjPopup.classList.contains('show')) {
        closePopup(toggleSkjPopup);
    }
    if (toggleAniPopup.classList.contains('show')) {
        closePopup(toggleAniPopup);
    }

    // Menutup popup toggleCame jika terbuka sebelumnya
    if (popup.classList.contains('show')) {
        closePopup(popup, () => {
            // Panggil removeActiveBottom setelah popup toggleCame ditutup
            removeActiveBottom();
        });
    } else {
        // Membuka popup toggleCame
        openPopup(popup);
    }
    removeActiveFree();
    removeActiveFreeAni(); 
});

document.getElementById('toggleMate').addEventListener('click', function() {
    const popup = document.getElementById('popup5'); 
    const toggleMbgPopup = document.getElementById('popup1');
    const toggleChartPopup = document.getElementById('popup2');
    const toggleBmPopup = document.getElementById('popup3');
    const toggleCamePopup = document.getElementById('popup4');
    const toggleSkjPopup = document.getElementById('popup6');
    const toggleAniPopup = document.getElementById('popup7');

    if (toggleMbgPopup.classList.contains('show')) {
        return; 
    }

    // Menutup seluruh popup yang sedang terbuka (termasuk popup lainnya)
    const popups = [toggleMbgPopup, toggleChartPopup, toggleBmPopup, toggleCamePopup, toggleSkjPopup, toggleAniPopup];

    popups.forEach(p => {
        if (p.classList.contains('show')) {
            closePopup(p);
        }
    });

    // Menutup atau membuka popup toggleMate
    if (popup.classList.contains('show')) {
        closePopup(popup, () => {
            // Panggil removeActiveBottom setelah popup toggleMate ditutup
            removeActiveBottom();
        });
    } else {
        openPopup(popup);
    }
    removeActiveFree();
    removeActiveFreeAni(); 
});

document.getElementById('toggleSkj').addEventListener('click', function() {
    const popup = document.getElementById('popup6'); 
    const button = document.getElementById('toggleSkj');
    const toggleMbgPopup = document.getElementById('popup1');
    const toggleChartPopup = document.getElementById('popup2');
    const toggleBmPopup = document.getElementById('popup3');
    const toggleCamePopup = document.getElementById('popup4');
    const toggleMatePopup = document.getElementById('popup5');
    const toggleAniPopup = document.getElementById('popup7');

    // Cegah buka popup lain saat toggleMbg masih aktif
    if (toggleMbgPopup.classList.contains('show')) return;

    // Tutup popup lain
    const popups = [toggleMbgPopup, toggleChartPopup, toggleBmPopup, toggleCamePopup, toggleMatePopup, toggleAniPopup];
    popups.forEach(p => {
        if (p.classList.contains('show')) closePopup(p);
    });

    // 🔹 Tambahkan ini agar semua active-bottom ikut hilang
    removeActiveBottom();
    removeActiveFree();
    removeActiveFreeAni(); 

    // Logika toggle
    if (popup.classList.contains('show')) {
        // Tutup popup dan hapus active-free
        closePopup(popup, () => {
            removeActiveFree();
        });
    } else {
        // Buka popup dan beri class active-free
        openPopup(popup);
        removeActiveFree(); // pastikan hanya 1 tombol aktif
        button.classList.add('active-free');
    }
});

document.getElementById('toggleAni').addEventListener('click', function() {
    const popup = document.getElementById('popup7'); 
    const button = document.getElementById('toggleAni');
    const toggleMbgPopup = document.getElementById('popup1');
    const toggleChartPopup = document.getElementById('popup2');
    const toggleBmPopup = document.getElementById('popup3');
    const toggleCamePopup = document.getElementById('popup4');
    const toggleMatePopup = document.getElementById('popup5');
    const toggleSkjPopup = document.getElementById('popup6');

    // Cegah buka popup lain saat toggleMbg masih aktif
    if (toggleMbgPopup.classList.contains('show')) return;

    // Tutup popup lain
    const popups = [toggleMbgPopup, toggleChartPopup, toggleBmPopup, toggleCamePopup, toggleMatePopup, toggleSkjPopup];
    popups.forEach(p => {
        if (p.classList.contains('show')) closePopup(p);
    });

    // 🔹 Tambahkan ini agar semua active-bottom ikut hilang
    removeActiveBottom();
    removeActiveFree();
    removeActiveFreeAni(); 

    // Logika toggle
    if (popup.classList.contains('show')) {
        // Tutup popup dan hapus active-free
        closePopup(popup, () => {
            removeActiveFree();
        });
    } else {
        // Buka popup dan beri class active-free
        openPopup(popup);
        removeActiveFree(); // pastikan hanya 1 tombol aktif
        button.classList.add('active-free');
    }
});

// Fungsi untuk menutup popup yang terbuka
function closePopup(popup, callback) {
    popup.classList.remove('show');
    popup.classList.add('hide');
    setTimeout(() => {
        popup.style.display = 'none';
        if (callback) {
            callback(); // Panggil callback setelah popup ditutup
        }
    }, 500); // Durasi animasi penutupan
}

// Fungsi untuk membuka popup
function openPopup(popup) {
    popup.style.display = 'flex';
    setTimeout(() => {
        popup.classList.remove('hide');
        popup.classList.add('show');
    }, 10);
}

// Fungsi untuk menghapus class active-bottom dari semua tombol
function removeActiveBottom() {
  const buttons = document.querySelectorAll('.bottom-navbar button:not(.plus)');
  buttons.forEach(button => {
    button.classList.remove('active-bottom');
    button.style.backgroundColor = '';  // Kembalikan warna tombol semula
  });
}


// Fungsi untuk menutup popup dengan callback setelah penutupan
function closePopup(popup, callback) {
    popup.classList.remove('show');
    popup.classList.add('hide');
    setTimeout(() => {
        popup.style.display = 'none';
        if (callback) {
            callback(); // Panggil callback setelah popup ditutup
        }
    }, 500); // Sesuaikan dengan durasi animasi penutupan
}

// Fungsi untuk membuka popup
function openPopup(popup) {
    popup.style.display = 'flex';
    setTimeout(() => {
        popup.classList.remove('hide');
        popup.classList.add('show');
    }, 10);
}

// const dropdowns = document.querySelectorAll('.dropdown-object');
// dropdowns.forEach(dropdown => {
//   const select = dropdown.querySelector('.select-by-object');
//   const caret = dropdown.querySelector('.caret');
//   const menu = dropdown.querySelector('.menu-by-object');
//   const options = dropdown.querySelectorAll('.menu-by-object li');
//   const selected = dropdown.querySelector('.selected-object');

//   select.addEventListener('click', () => {
//       caret.classList.toggle('caret-rotate');
//       menu.classList.toggle('buka-menu');
//   });

//   options.forEach(option => {
//     option.addEventListener('click', () => {
//         selected.innerText = option.innerText;
//         selected.classList.add("text-fade-in");

//         setTimeout(() => selected.classList.remove("text-fade-in"), 300);

//         caret.classList.remove('caret-rotate');
//         menu.classList.remove('buka-menu');

//         options.forEach(opt => opt.classList.remove('active-view'));
//         option.classList.add('active-view');
//     });
//   });

//    window.addEventListener("click", e => {
//     const size = dropdown.getBoundingClientRect();
//     if (
//         e.clientX < size.left ||
//         e.clientX > size.right ||
//         e.clientY < size.top ||
//         e.clientY > size.bottom
//     ) {
//         caret.classList.remove('caret-rotate');
//         menu.classList.remove('buka-menu');
//     }
//   });
// });
