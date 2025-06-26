document.addEventListener("DOMContentLoaded", function () {
  const openSettingBtn = document.getElementById("openSettingBtn");
  const cardWrapper = document.getElementById("cardWrapper");

  const openBtn = document.getElementById("openSettingDasboard"); // Tombol buka utama
  const closeButtons = document.querySelectorAll(".close-btn-lr"); 
 

  const panelSetting = document.querySelector(".panel-setting");
  const panelSettingInfo = document.querySelector(".panel-setting-info");
  const panelSettingAdvance = document.getElementById("panelSettingAdvance");

  const cardContainer = document.querySelector(".card-container");

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
    panel.container.style.height = "430px";
    panel.icon.classList.remove("fa-plus");
    panel.icon.classList.add("fa-minus");
    panel.isExpanded = true;
  }

  function updateGridLayout() {
    const isMeshOpen = panels.mesh.isExpanded;
    const isBloomOpen = panels.bloom.isExpanded;

    cardContainer.classList.toggle("grid-3", isMeshOpen || isBloomOpen);
  }

  function togglePanel(activeKey) {
    Object.keys(panels).forEach((key) => {
      if (key === activeKey) {
        panels[key].isExpanded ? collapsePanel(key) : expandPanel(key);
      } else {
        collapsePanel(key);
      }
    });

    updateGridLayout();
  }

  panels.mesh.toggleBtn.addEventListener("click", () => togglePanel("mesh"));
  panels.bloom.toggleBtn.addEventListener("click", () => togglePanel("bloom"));

  openBtn.addEventListener("click", () => {
    panelSetting.style.display = "block";
    isAdvanceOpen = true;

    handleResponsivePanel();
    handleResponsiveAdvancePanel();

    requestAnimationFrame(() => {
      panelSetting.classList.add("panel-active");
    });
  });

  closeButtons.forEach(button => {
    button.addEventListener("click", () => {
      panelSetting.classList.remove("panel-active");
      panelSettingInfo.classList.remove("panel-active");
      panelSettingAdvance.classList.remove("panel-active");

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