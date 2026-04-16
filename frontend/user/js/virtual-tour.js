import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { AutorotatePlugin } from "@photo-sphere-viewer/autorotate-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";
import "../css/virtual-tour.css";
import "../css/modals-vt.css";
import "../css/sidebar-vt.css";
import { openInfoModal } from "./modals-vt.js";

// =====================
//  HELPER — build marker HTML
// =====================

function navMarkerHTML(iconUrl) {
  return `<div class="circle-marker pulse-marker">
    <div class="pulse-container">
      <div class="pulse1"></div>
      <div class="pulse2"></div>
      <div class="pulse3"></div>
    </div>
    <img src="${iconUrl}" alt="marker image" />
  </div>`;
}

function infoMarkerHTML(iconUrl) {
  return `<div class="info-marker">
    <img src="${iconUrl}" alt="Info Marker" />
  </div>`;
}

// =====================
//  FETCH SCENES & BUILD NODES
// =====================

async function buildNodes(settings) {
  const res = await fetch("/api/scenes");
  const scenes = await res.json();

  const infoIconUrl =
    settings.info_marker_icon_url ||
    `https://tghodrmjcvuijdsgqbwj.supabase.co/storage/v1/object/public/virtual-tour/icons/info_modal/info_marker.png`;

  return scenes.map((scene) => {
    const markers = [];

    (scene.navigation_markers || []).forEach((m) => {
      markers.push({
        id: m.id,
        position: { yaw: m.yaw, pitch: m.pitch },
        html: navMarkerHTML(m.icon_url || infoIconUrl),
        anchor: "center center",
        tooltip: m.tooltip || "",
        style: { cursor: "pointer" },
      });
    });

    (scene.info_markers || []).forEach((m) => {
      markers.push({
        id: m.id,
        position: { yaw: m.yaw, pitch: m.pitch },
        html: infoMarkerHTML(infoIconUrl),
        anchor: "center center",
        tooltip: m.tooltip || "",
        style: { cursor: "pointer" },
      });
    });

    return {
      id: scene._id,
      panorama: scene.panorama_url,
      markers,
      links: (scene.links || []).map((l) => ({
        nodeId: l.nodeId,
        position: { yaw: l.yaw, pitch: l.pitch },
      })),
    };
  });
}

// =====================
//  INIT VIEWER
// =====================

async function initViewer() {
  const [settingsRes] = await Promise.all([fetch("/api/settings")]);
  const settings = await settingsRes.json();
  const nodes = await buildNodes(settings);

  const viewer = new Viewer({
    container: document.querySelector("#viewer"),
    loadingImg: settings.loading_gif_url || "assets/logos/DLSUD_vt_loading.gif",
    moveSpeed: 2.0,
    moveInertia: true,
    maxTextureSize: 4096,
    defaultYaw: "0deg",
    touchmoveTwoFingers: false,
    mousewheelCtrlKey: true,
    navbar: false,
    plugins: [
      [MarkersPlugin, {}],
      [
        AutorotatePlugin,
        {
          autorotateSpeed: "1rpm",
          autorotatePitch: "0deg",
          autostartDelay: 0,
          autostartOnIdle: false,
        },
      ],
      [
        VirtualTourPlugin,
        {
          dataMode: "client",
          positionMode: "manual",
          renderMode: "3d",
          maxTextureSize: 4096,
          preload: false, // ← disable preload — only load current scene
          moveInertia: true,
          startNodeId: "Start",
          nodes,
        },
      ],
    ],
  });

  // =====================
  //  MARKER CLICK HANDLER
  // =====================

  const markersPlugin = viewer.getPlugin(MarkersPlugin);
  const virtualTourPlugin = viewer.getPlugin(VirtualTourPlugin);

  markersPlugin.addEventListener("select-marker", ({ marker }) => {
    // Info marker — open info modal
    if (marker.id.endsWith("-info")) {
      // Try direct scene ID first (e.g. "JFH-info" → "JFH")
      let sceneId = marker.id.replace(/-info$/, "");

      // Handle special cases where marker ID prefix doesn't match scene ID
      const infoMarkerMap = {
        gate1: "Gate 1",
        gate2: "Gate 2",
        gate3: "Gate 3",
        gate4: "Gate 4",
        Statue: "Rotunda(front)",
        MAH: "Lake Avenue (1)",
        BG: "Lake Avenue (7)",
        CHC: "Lake Avenue (7)",
        RSM: "Gate 4 Way (6)",
        MP: "Gate 4",
        MotorPool: "Motor Pool",
        ERC: "AEA Road (2)",
        OVL: "Oval (Lef)",
        GMH: "AL (3)",
        FBH: "Acacia Avenue (1)",
        KND: "Acacia Avenue (4)",
        SAH: "West Avenue (8)",
        SEC: "West Avenue (12)",
        HS: "HS (2)",
        GS: "GS (1)",
        FCH: "FCH (1)",
        LDH: "LDH (1)",
      };

      if (infoMarkerMap[sceneId]) sceneId = infoMarkerMap[sceneId];
      openInfoModal(sceneId, marker.id);
      return;
    }

    // Navigation marker — navigate to target scene
    const targetNodeId = marker.id.replace("go-to-", "");
    if (targetNodeId) {
      virtualTourPlugin.setCurrentNode(targetNodeId);
    }
  });

  // =====================
  //  NODE CHANGED LOG
  // =====================

  virtualTourPlugin.addEventListener("node-changed", ({ node, data }) => {
    console.log(`Navigated to: ${node.id}`);
    if (data.fromNode) console.log(`Previous: ${data.fromNode.id}`);
  });

  // =====================
  //  WELCOME BOX + START BUTTON
  // =====================

  const welcomeBox = document.getElementById("welcome-box");
  if (welcomeBox) {
    welcomeBox.style.display = "flex";
    setTimeout(() => welcomeBox.classList.add("show"), 50);
  }

  viewer.addEventListener("ready", () => {
    viewer.getPlugin(AutorotatePlugin).start();
  });

  const startBtn = document.getElementById("start-tour-btn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      viewer.getPlugin(AutorotatePlugin).stop();
      document.getElementById("welcome-box").style.display = "none";
      const sideNav = document.getElementById("side-nav");
      sideNav.classList.add("show-sidebar", "collapsed");
      document.body.classList.add("tour-in-progress");
      virtualTourPlugin.setCurrentNode("Gate 1");
    });
  }

  return viewer;
}

// =====================
//  EXPORT VIEWER
// =====================

// initViewer() returns a promise — export it so u_sidebar.js can use the viewer
export const viewerPromise = initViewer();

// For backward compatibility with any code that imports viewer directly
export const viewer = await viewerPromise;
