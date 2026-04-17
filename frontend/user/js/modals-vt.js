// modals.js — handles welcome modal, video modal, info modal, gallery

// =====================
//  SETTINGS → WELCOME MODAL + VIDEO + AUDIO BUTTONS
// =====================

async function loadModalSettings() {
  const res = await fetch("/api/settings");
  const settings = await res.json();

  // Welcome modal
  document.getElementById("welcome-logo").src = settings.welcome_logo_url;
  document.getElementById("welcome-title").textContent = settings.welcome_title;
  document.getElementById("welcome-subtitle").textContent =
    settings.welcome_subtitle;
  document.getElementById("welcome-description").innerHTML =
    settings.welcome_description;
  document.getElementById("start-tour-btn").textContent =
    settings.welcome_btn_label;

  // Apply modal size
  const welcomeContent = document.querySelector(".welcome-content");
  if (welcomeContent) {
    if (settings.welcome_modal_width)
      welcomeContent.style.width = settings.welcome_modal_width + "px";
    if (settings.welcome_modal_height)
      welcomeContent.style.minHeight = settings.welcome_modal_height + "px";
  }

  // Video source
  const videoSource = document.getElementById("video-source");
  if (videoSource && settings.video_url) {
    videoSource.src = settings.video_url;
  }

  // =====================
  //  NARRATION BUTTON
  // =====================
  const narrativeBtn = document.getElementById("narrative-btn");
  const narrativeIcon = document.getElementById("icon-narrative");
  const iconNarrativeDefault = settings.icon_narrative_url;
  const iconNarrativePlay =
    settings.icon_narrative_play_url || settings.icon_narrative_url;
  const iconNarrativeMute =
    settings.icon_narrative_mute_url || settings.icon_narrative_url;

  let narrationAudio = null;
  let narrationPlaying = false;

  if (settings.narration_url) {
    narrationAudio = new Audio(settings.narration_url);

    narrativeBtn.addEventListener("click", () => {
      if (!narrationPlaying) {
        narrationAudio.play();
        narrationPlaying = true;
        narrativeIcon.src = iconNarrativePlay;
      } else {
        narrationAudio.pause();
        narrationAudio.currentTime = 0;
        narrationPlaying = false;
        narrativeIcon.src = iconNarrativeDefault;
      }
    });

    narrationAudio.addEventListener("ended", () => {
      narrationPlaying = false;
      narrativeIcon.src = iconNarrativeDefault;
    });
  }

  // =====================
  //  BGM BUTTON
  // =====================
  const musicBtn = document.getElementById("music-btn");
  const bgmIcon = document.getElementById("icon-bgm");
  const iconBgmDefault = settings.icon_bgm_url;
  const iconBgmPlay = settings.icon_bgm_play_url || settings.icon_bgm_url;
  const iconBgmMute = settings.icon_bgm_mute_url || settings.icon_bgm_url;

  let bgmPlaying = false;
  let bgmAudio = null;
  let bgmTrackIndex = 0;

  // BGM stored as comma-separated URLs
  const bgmTracks = settings.bgm_url
    ? settings.bgm_url
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  function playNextBGM() {
    if (!bgmTracks.length) return;
    bgmAudio = new Audio(bgmTracks[bgmTrackIndex]);
    bgmAudio.volume = 0.3;
    bgmAudio.play();
    bgmAudio.addEventListener("ended", () => {
      bgmTrackIndex = (bgmTrackIndex + 1) % bgmTracks.length;
      playNextBGM();
    });
  }

  if (bgmTracks.length) {
    musicBtn.addEventListener("click", () => {
      if (!bgmPlaying) {
        playNextBGM();
        bgmPlaying = true;
        bgmIcon.src = iconBgmPlay;
      } else {
        if (bgmAudio) {
          bgmAudio.pause();
          bgmAudio = null;
        }
        bgmPlaying = false;
        bgmIcon.src = iconBgmDefault;
      }
    });
  }
}

// =====================
//  VIDEO MODAL
// =====================

const videoBtn = document.getElementById("video-btn");
const videoOverlay = document.getElementById("video-overlay");
const closeVideoBtn = document.getElementById("close-video-btn");
const videoPlayer = document.getElementById("video-player");

videoBtn?.addEventListener("click", () => {
  videoOverlay.style.display = "flex";
  videoPlayer.load();
  videoPlayer.play();
});

closeVideoBtn?.addEventListener("click", () => {
  videoOverlay.style.display = "none";
  videoPlayer.pause();
  videoPlayer.currentTime = 0;
});

// Close when clicking outside the video container
videoOverlay?.addEventListener("click", (e) => {
  if (e.target === videoOverlay) {
    videoOverlay.style.display = "none";
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
  }
});

// =====================
//  INIT
// =====================

loadModalSettings();

// =====================
//  INFO MODAL
// =====================

let currentAudio = null;
let infoAudioPlaying = false;
let galleryImages = [];
let currentGalleryIndex = 0;

export async function openInfoModal(sceneId, markerId) {
  const res = await fetch(`/api/scenes/${sceneId}`);
  const scene = await res.json();

  if (!scene) return;

  // Pick the right modal: check modals map by markerId first, fall back to modal
  const modalsMap = scene.modals || {};
  const modalData =
    markerId && modalsMap[markerId] ? modalsMap[markerId] : scene.modal;

  if (!modalData || !modalData.title) return;

  document.getElementById("building-info-title").textContent =
    modalData.title || scene.title;
  document.getElementById("building-info-desc").innerHTML =
    modalData.description || "";

  const infoBox = document.getElementById("building-info-box");
  infoBox.style.display = "flex";
  infoBox.style.opacity = "1";
  infoBox.style.visibility = "visible";

  // =====================
  //  INFO MODAL AUDIO
  // =====================
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  infoAudioPlaying = false;

  const audioBtn = document.getElementById("audio-btn");
  const audioIcon = document.getElementById("icon-info-audio");

  // Fetch settings for audio icons
  const settingsRes = await fetch("/api/settings");
  const settings = await settingsRes.json();
  const iconPlay = settings.icon_info_audio_url;
  const iconStop =
    settings.icon_info_audio_stop_url ||
    settings.icon_narrative_mute_url ||
    settings.icon_info_audio_url;

  if (modalData.audio_url) {
    currentAudio = new Audio(modalData.audio_url);

    const newAudioBtn = audioBtn.cloneNode(true);
    audioBtn.parentNode.replaceChild(newAudioBtn, audioBtn);
    const newAudioIcon = document.getElementById("icon-info-audio");

    newAudioBtn.addEventListener("click", () => {
      if (!infoAudioPlaying) {
        currentAudio.play();
        infoAudioPlaying = true;
        if (newAudioIcon) newAudioIcon.src = iconStop;
      } else {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        infoAudioPlaying = false;
        if (newAudioIcon) newAudioIcon.src = iconPlay;
      }
    });

    currentAudio.addEventListener("ended", () => {
      infoAudioPlaying = false;
      if (newAudioIcon) newAudioIcon.src = iconPlay;
    });
  }

  // =====================
  //  GALLERY
  // =====================
  galleryImages = modalData.gallery || [];
  currentGalleryIndex = 0;

  const galleryBtn = document.getElementById("view-gallery-btn");
  const newGalleryBtn = galleryBtn.cloneNode(true);
  galleryBtn.parentNode.replaceChild(newGalleryBtn, galleryBtn);

  newGalleryBtn.addEventListener("click", () => {
    if (galleryImages.length > 0) openGallery();
  });

  // =====================
  //  CLOSE
  // =====================
  const closeBtn = document.getElementById("building-info-close");
  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

  newCloseBtn.addEventListener("click", () => {
    infoBox.style.display = "none";
    infoBox.style.opacity = "0";
    infoBox.style.visibility = "hidden";
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    infoAudioPlaying = false;
  });
}

// =====================
//  GALLERY MODAL
// =====================

function openGallery() {
  const galleryModal = document.getElementById("gallery-modal");
  galleryModal.style.display = "flex";
  updateGalleryImage();

  document.getElementById("prev-image").onclick = () => {
    currentGalleryIndex =
      (currentGalleryIndex - 1 + galleryImages.length) % galleryImages.length;
    updateGalleryImage();
  };

  document.getElementById("next-image").onclick = () => {
    currentGalleryIndex = (currentGalleryIndex + 1) % galleryImages.length;
    updateGalleryImage();
  };

  document.getElementById("close-gallery").onclick = () => {
    galleryModal.style.display = "none";
  };
}

function updateGalleryImage() {
  document.getElementById("gallery-current-img").src =
    galleryImages[currentGalleryIndex];
}
