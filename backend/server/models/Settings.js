import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    // Only one settings document will ever exist
    _id: { type: String, default: "site_settings" },

    // =====================
    //  SIDEBAR BRANDING
    // =====================
    logo_url: { type: String, default: "" },
    logo_collapsed_url: { type: String, default: "" },
    loading_gif_url: { type: String, default: "" },
    site_title: { type: String, default: "NAVIGATE LA SALLE" },
    site_subtitle: { type: String, default: "Virtual Tour of DLSU-D Campus" },

    // =====================
    //  WELCOME MODAL
    // =====================
    welcome_logo_url: { type: String, default: "" },
    welcome_title: { type: String, default: "Welcome to Navigate La Salle" },
    welcome_subtitle: { type: String, default: "Explore the DLSU-D Campus in 360°" },
    welcome_description: {
      type: String,
      default:
        "Use this virtual tour to explore the De La Salle University - Dasmariñas campus from anywhere. Click on the markers to move between locations and discover our beautiful grounds and facilities.",
    },
    welcome_btn_label: { type: String, default: "Start Tour" },
    welcome_modal_width: { type: Number, default: 600 },
    welcome_modal_height: { type: Number, default: 400 },

    // =====================
    //  FUNCTION BUTTONS
    // =====================
    narration_url: { type: String, default: "" },   // intro narration audio
    bgm_url: { type: String, default: "" },          // background music audio
    video_url: { type: String, default: "" },         // campus tour video

    // =====================
    //  DASHBOARD BUTTON
    // =====================
    dashboard_label: { type: String, default: "Dashboard" },
    dashboard_icon_url: { type: String, default: "" },
    dashboard_url: { type: String, default: "/admin/pages/dashboard.html" },

    // =====================
    //  SIDEBAR CATEGORY ICONS
    // =====================
    icon_buildings_url:   { type: String, default: "" },
    icon_facilities_url:  { type: String, default: "" },
    icon_landmarks_url:   { type: String, default: "" },
    icon_gates_url:       { type: String, default: "" },
    icon_parking_url:     { type: String, default: "" },

    // =====================
    //  SIDEBAR BUTTON ICONS
    // =====================
    icon_latch_open_url:  { type: String, default: "" },
    icon_latch_close_url: { type: String, default: "" },
    icon_narrative_url:   { type: String, default: "" },
    icon_narrative_play_url: { type: String, default: "" },
    icon_narrative_mute_url: { type: String, default: "" },
    icon_video_url:       { type: String, default: "" },
    icon_bgm_url:         { type: String, default: "" },
    icon_bgm_play_url:    { type: String, default: "" },
    icon_bgm_mute_url:    { type: String, default: "" },

    // =====================
    //  INFO MODAL ICONS
    // =====================
    info_marker_icon_url: { type: String, default: "" },
    icon_info_gallery_url: { type: String, default: "" },
    icon_info_audio_url:   { type: String, default: "" },
    icon_info_close_url:   { type: String, default: "" },
    icon_video_close_url:  { type: String, default: "" },
    icon_sb_control_url:   { type: String, default: "" },
  },
  {
    collection: "settings",
    timestamps: true,
  }
);

export default mongoose.model("Settings", settingsSchema);
