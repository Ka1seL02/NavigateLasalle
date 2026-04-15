import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { viewerPromise } from "./virtual-tour.js";

// =====================
//  FETCH & POPULATE
// =====================

async function loadSettings() {
  const res = await fetch("/api/settings");
  const settings = await res.json();

  // Sidebar branding
  document.getElementById("sidebar-logo").src = settings.logo_url;
  const collapsedLogo = document.getElementById("sidebar-logo-collapsed");
  if (collapsedLogo) collapsedLogo.src = settings.logo_collapsed_url;

  // Sidebar category icons
  document.getElementById("icon-buildings").src = settings.icon_buildings_url;
  document.getElementById("icon-facilities").src = settings.icon_facilities_url;
  document.getElementById("icon-landmarks").src = settings.icon_landmarks_url;
  document.getElementById("icon-gates").src = settings.icon_gates_url;
  document.getElementById("icon-parking").src = settings.icon_parking_url;

  // Sidebar latch + button icons
  const latchIcon = document.getElementById("icon-latch");
  if (latchIcon) latchIcon.src = settings.icon_latch_open_url;
  const narrativeIcon = document.getElementById("icon-narrative");
  if (narrativeIcon) narrativeIcon.src = settings.icon_narrative_url;
  const sbControl = document.getElementById("icon-sidebar-control");
  if (sbControl) sbControl.src = settings.icon_sb_control_url;
  const videoIcon = document.getElementById("icon-video");
  if (videoIcon) videoIcon.src = settings.icon_video_url;
  const bgmIcon = document.getElementById("icon-bgm");
  if (bgmIcon) bgmIcon.src = settings.icon_bgm_url;

  // Info modal icons
  const infoGallery = document.getElementById("icon-info-gallery");
  if (infoGallery) infoGallery.src = settings.icon_info_gallery_url;
  const infoAudio = document.getElementById("icon-info-audio");
  if (infoAudio) infoAudio.src = settings.icon_info_audio_url;
  const infoClose = document.getElementById("icon-info-close");
  if (infoClose) infoClose.src = settings.icon_info_close_url;
  const videoClose = document.getElementById("icon-video-close");
  if (videoClose) videoClose.src = settings.icon_video_close_url;

  // Dashboard button
  document.getElementById("dashboard-icon").src = settings.dashboard_icon_url;
  document.getElementById("dashboard-label").textContent = settings.dashboard_label;
  document.getElementById("go-back").onclick = () => {
    window.location.href = settings.dashboard_url;
  };
}

async function loadSidebarScenes() {
  const res = await fetch("/api/scenes");
  const scenes = await res.json();

  function makeItem(node, label) {
    const item = document.createElement("div");
    item.className = "submenu-item";
    item.dataset.node = node;
    item.textContent = label;
    item.addEventListener("click", async () => {
      const viewer = await viewerPromise;
      const virtualTour = viewer.getPlugin(VirtualTourPlugin);
      if (virtualTour) {
        const panoramaOverrides = {
          "Motor Pool": { nodeId: "Gate 4", yaw: 5.877, pitch: 0.05 },
        };
        const override = panoramaOverrides[node];
        if (override) {
          await virtualTour.setCurrentNode(override.nodeId);
          viewer.rotate({ yaw: override.yaw, pitch: override.pitch });
        } else {
          virtualTour.setCurrentNode(node);
        }
      }
      toggleNav();
    });
    return item;
  }

  // ── BUILDINGS ──
  const buildingsEast = [
    { node: "JFH",             label: "Julian Felipe Hall" },
    { node: "TJF",             label: "Tanghalang Julian Felipe" },
    { node: "PCH",             label: "Paulo Campos Hall" },
    { node: "LCDC",            label: "Lasallian Community Development Center" },
    { node: "COS",             label: "College of Science" },
    { node: "ADG",             label: "Ayuntamiento de Gonzales" },
    { node: "SDLAH",           label: "Severino de Las Alas Hall (Alumni Bldg)" },
    { node: "ICTC",            label: "Information and Communications Technology Center" },
    { node: "LPDSB",           label: "La Porteria de San Benildo" },
    { node: "Lake Avenue (1)", label: "Mariano Alvarez Hall" },
    { node: "CTHM", label: "College of Tourism and Hospitality Management" },
    { node: "AEA",             label: "Aklatang Emilio Aguinaldo" },
  ];
  const buildingsWest = [
    { node: "CTH",                label: "Candido Tirona Hall" },
    { node: "FCH (1)",            label: "Felipe Calderon Hall" },
    { node: "GS (1)",             label: "Grandstand" },
    { node: "LDH (1)",            label: "Ladislao Diwa Hall" },
    { node: "MTH",                label: "Mariano Trias Hall" },
    { node: "VBH",                label: "Vito Belarmino Hall" },
    { node: "CBAA",               label: "College of Business Administration and Accountancy" },
    { node: "CEAT",               label: "College of Engineering, Architecture, and Technology" },
    { node: "AL (3)",             label: "Gregoria Montoya Hall" },
    { node: "West Avenue (8)",    label: "Santiago Alvarez Hall" },
    { node: "Acacia Avenue (1)",  label: "Francisco Barzaga Hall (POLCA Office)" },
    { node: "HS (2)",             label: "DLSU-D High School Complex" },
  ];
  document.getElementById("buildings-east-list") &&
    buildingsEast.forEach(({ node, label }) => document.getElementById("buildings-east-list").appendChild(makeItem(node, label)));
  document.getElementById("buildings-west-list") &&
    buildingsWest.forEach(({ node, label }) => document.getElementById("buildings-west-list").appendChild(makeItem(node, label)));

  // ── FACILITIES ──
  const facilitiesEast = [
    { node: "HR",             label: "Hotel Rafael" },
    { node: "Diner",          label: "Mila's Diner" },
    { node: "CM",             label: "Café Museo" },
    { node: "UFS",            label: "University Food Square" },
    { node: "LMDC",           label: "Ladies' and Men's Dormitory Complex" },
    { node: "Gate 4 Way (6)", label: "Residencia San Miguel" },
    { node: "Gate 4",         label: "Motor Pool (Transportation Bldg.)" },
    { node: "AEA Road (2)",   label: "Electronic Resource Center (AEA-ERC)" },
  ];
  const facilitiesWest = [
    { node: "BPA",               label: "Bahay Pag-asa" },
    { node: "Pool",              label: "University Olympic Size Swimming Pool" },
    { node: "RCC",               label: "Retreat & Conference Center" },
    { node: "ULS",               label: "Ugnayang La Salle" },
    { node: "West Avenue (12)",  label: "Security Office" },
    { node: "Acacia Avenue (4)", label: "Kabalikat ng DLSU-D" },
    { node: "Oval (Lef)",        label: "Track and Oval" },
  ];
  document.getElementById("facilities-east-list") &&
    facilitiesEast.forEach(({ node, label }) => document.getElementById("facilities-east-list").appendChild(makeItem(node, label)));
  document.getElementById("facilities-west-list") &&
    facilitiesWest.forEach(({ node, label }) => document.getElementById("facilities-west-list").appendChild(makeItem(node, label)));

  // ── LANDMARKS ──
  const landmarksEast = [
    { node: "Rotunda(front)",  label: "Statue of St. John Baptist de La Salle" },
    { node: "SS",              label: "Study Shed (Kubo)" },
    { node: "LB",              label: "Lumina Bridge" },
    { node: "LP",              label: "Lake Park" },
    { node: "Lake Avenue (7)", label: "Botanical Garden" },
    { node: "Lake Avenue (7)", label: "Br. Gus Boquer FSC Cultural Heritage Complex" },
    { node: "Fountain (1)",    label: "Fountain" },
    { node: "Batibot",         label: "Batibot" },
    { node: "MDLS",            label: "Museo de La Salle" },
    { node: "Chapel",          label: "Antonio & Victoria Cojuangco Memorial Chapel of Our Lady of the Holy Rosary" },
  ];
  const landmarksWest = [
    { node: "UEC", label: "University Events Center" },
  ];
  document.getElementById("landmarks-east-list") &&
    landmarksEast.forEach(({ node, label }) => document.getElementById("landmarks-east-list").appendChild(makeItem(node, label)));
  document.getElementById("landmarks-west-list") &&
    landmarksWest.forEach(({ node, label }) => document.getElementById("landmarks-west-list").appendChild(makeItem(node, label)));

  // ── GATES ──
  const gatesEast = [
    { node: "Gate 1", label: "Magdalo Gate (Gate 1)" },
    { node: "Gate 2", label: "Magpuri Gate (Gate 2)" },
    { node: "Gate 4", label: "Magtagumpay Gate (Gate 4)" },
  ];
  const gatesWest = [
    { node: "Gate 3", label: "Magdiwang Gate (Gate 3)" },
  ];
  document.getElementById("gates-east-list") &&
    gatesEast.forEach(({ node, label }) => document.getElementById("gates-east-list").appendChild(makeItem(node, label)));
  document.getElementById("gates-west-list") &&
    gatesWest.forEach(({ node, label }) => document.getElementById("gates-west-list").appendChild(makeItem(node, label)));

  // ── PARKING ──
  const parkingEast = [
    { node: "COS Parking",    label: "COS-ADG Parking" },
    { node: "G2 Parking (2)", label: "G1-G2 Parking" },
    { node: "G4 Parking (1)", label: "G1-G4 Parking" },
    { node: "Chapel Parking", label: "Chapel Parking" },
  ];
  const parkingWest = [
    { node: "ULS Parking (1)",  label: "ULS Parking" },
    { node: "PCCA Parking (1)", label: "FBH Parking" },
    { node: "OU Parking (1)",   label: "Oval-ULS Parking" },
    { node: "GS Parking",       label: "GS Parking" },
    { node: "GMH Parking",      label: "GMH Parking" },
    { node: "CM Parking (1)",   label: "CBAA-MTH Parking" },
  ];
  document.getElementById("parking-east-list") &&
    parkingEast.forEach(({ node, label }) => document.getElementById("parking-east-list").appendChild(makeItem(node, label)));
  document.getElementById("parking-west-list") &&
    parkingWest.forEach(({ node, label }) => document.getElementById("parking-west-list").appendChild(makeItem(node, label)));
}

// =====================
//  SIDEBAR TOGGLE
// =====================

function hideExtended() {
  const extendedSidebar = document.querySelector(".extended-sidebar");
  extendedSidebar.classList.remove("ext-show");
  extendedSidebar.classList.add("ext-hide");
  setTimeout(() => {
    extendedSidebar.classList.remove("ext-hide");
    extendedSidebar.classList.add("ext-hidden");
  }, 300);
  document.querySelectorAll(".extended-menu").forEach((m) => (m.style.display = "none"));
  document.querySelectorAll(".nav-item-row").forEach((i) => i.classList.remove("active"));
}

function toggleNav() {
  const sideNav = document.getElementById("side-nav");
  const latch = document.getElementById("sidebar-latch");
  const isCollapsed = sideNav.classList.contains("collapsed");

  if (isCollapsed) {
    sideNav.classList.remove("collapsed", "hide-sidebar");
    sideNav.classList.add("show-sidebar");
    latch.style.display = "none";
  } else {
    sideNav.classList.remove("show-sidebar");
    sideNav.classList.add("hide-sidebar");
    hideExtended();
    setTimeout(() => {
      sideNav.classList.remove("hide-sidebar");
      sideNav.classList.add("collapsed");
      if (document.body.classList.contains("tour-in-progress")) {
        latch.style.display = "flex";
      }
    }, 400);
  }
}

// =====================
//  SUBMENU TOGGLE
// =====================

function toggleSubmenu(section) {
  const submenu = document.getElementById(`${section}-submenu`);
  const extendedSidebar = document.querySelector(".extended-sidebar");

  if (!submenu) return;

  if (submenu.style.display === "block") {
    hideExtended();
  } else {
    document.querySelectorAll(".extended-menu").forEach((m) => (m.style.display = "none"));
    submenu.style.display = "block";
    extendedSidebar.classList.remove("ext-hide", "ext-hidden");
    extendedSidebar.classList.add("ext-show");
    document.querySelectorAll(".nav-item-row").forEach((i) => i.classList.remove("active"));
    document.getElementById(section)?.classList.add("active");
  }
}

// Expose to HTML onclick attributes
window.toggleNav = toggleNav;
window.toggleSubmenu = toggleSubmenu;

// =====================
//  SIDEBAR CONTROL DROPDOWN
// =====================

const sbControlBtn = document.getElementById("sidebar-control-btn");
const sbControlMenu = document.getElementById("sb-control-menu");
const sbOptExpanded = document.getElementById("sb-opt-expanded");
const sbOptCollapsed = document.getElementById("sb-opt-collapsed");

let sbMode = "expanded";

function setSidebarMode(mode) {
  const sideNav = document.getElementById("side-nav");
  const extendedSidebar = document.querySelector(".extended-sidebar");
  sbMode = mode;
  extendedSidebar.style.transition = "left 0.35s ease";
  if (mode === "collapsed") {
    sideNav.classList.add("sb-collapsed-mode");
    sbOptCollapsed.classList.add("active");
    sbOptExpanded.classList.remove("active");
    extendedSidebar.style.left = "3.85vw";
  } else {
    sideNav.classList.remove("sb-collapsed-mode");
    sbOptExpanded.classList.add("active");
    sbOptCollapsed.classList.remove("active");
    extendedSidebar.style.left = "";
  }
  sbControlMenu.classList.remove("open");
}

sbControlBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  sbControlMenu.classList.toggle("open");
});

sbOptExpanded.addEventListener("click", (e) => { e.stopPropagation(); setSidebarMode("expanded"); });
sbOptCollapsed.addEventListener("click", (e) => { e.stopPropagation(); setSidebarMode("collapsed"); });

// Set initial active state
sbOptExpanded.classList.add("active");

// Close sidebar when clicking outside
document.addEventListener("click", (e) => {
  const sideNav = document.getElementById("side-nav");
  const extendedSidebar = document.querySelector(".extended-sidebar");
  const latch = document.getElementById("sidebar-latch");
  if (sbControlMenu.classList.contains("open") && !sbControlBtn.contains(e.target)) {
    sbControlMenu.classList.remove("open");
    return;
  }
  if (sideNav.classList.contains("collapsed")) return;
  if (!sideNav.contains(e.target) && !extendedSidebar.contains(e.target) && !latch.contains(e.target)) {
    toggleNav();
  }
});

// =====================
//  INIT
// =====================

loadSettings();
loadSidebarScenes();
