import mongoose from "mongoose";

const markerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    yaw: Number,
    pitch: Number,
    icon_url: String,
    tooltip: String,
  },
  { _id: false }
);

const linkSchema = new mongoose.Schema(
  {
    nodeId: { type: String, required: true },
    yaw: Number,
    pitch: Number,
  },
  { _id: false }
);

const modalSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    gallery: [String],   // array of image URLs
    audio_url: String,
  },
  { _id: false }
);

const sceneSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },  // e.g. "JFH", "Gate 1", "Lake Avenue (1)"

    // Display info
    title: { type: String, required: true }, // e.g. "Julian Felipe Hall"

    // Used by sidebar categories and submenus
    campus: {
      type: String,
      enum: ["east", "west", "both"],
      required: true,
    },
    category: {
      type: String,
      enum: ["buildings", "facilities", "landmarks", "parking", "roads", "gates", "start"],
      required: true,
    },

    // 360 panorama image URL (Supabase storage URL)
    panorama_url: { type: String, required: true },

    // Initial camera angle when entering this scene
    initial_view: {
      yaw: { type: Number, default: 0 },
      pitch: { type: Number, default: 0 },
      hfov: { type: Number, default: 90 },
    },

    // Navigation markers (circle markers with pulse — move to another scene)
    navigation_markers: [markerSchema],

    // Info markers (info icon — opens the building info modal)
    info_markers: [markerSchema],

    // Links used by VirtualTourPlugin to connect scenes
    links: [linkSchema],

    // Modal content shown when an info marker is clicked
    modal: modalSchema,

    // For scenes with multiple info markers, modals is a map keyed by info_marker id
    // e.g. { "gate4-info": { ...}, "MP-info": { ... } }
    modals: {
      type: Map,
      of: modalSchema,
      default: undefined,
    },

    // Sidebar display — used when a scene should appear in the sidebar
    // under a different name or category than its actual scene category
    // e.g. a road scene that shows a building gets sidebar_category: "buildings"
    sidebar_label: { type: String, default: "" },       // name shown in sidebar
    sidebar_category: {                                  // which submenu it appears under
      type: String,
      enum: ["buildings", "facilities", "landmarks", "parking", ""],
      default: "",
    },
  },
  {
    collection: "scenes",
    timestamps: true,
  }
);

export default mongoose.model("Scene", sceneSchema);
