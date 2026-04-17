import express from "express";
import multer from "multer";
import Settings from "../models/Settings.js";
import { verifyToken } from "../middleware/auth.js";
import { supabase, BUCKET_NAME } from "../config/supabase.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
});

// Helper: extract bucket path from a Supabase public URL
const SUPABASE_PUBLIC_PREFIX = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.BUCKET_NAME || "virtual-tour"}/`;
function bucketPathFromUrl(url) {
  if (!url || !url.startsWith(SUPABASE_PUBLIC_PREFIX)) return null;
  return decodeURIComponent(url.slice(SUPABASE_PUBLIC_PREFIX.length));
}

// POST upload a file for settings (admin)
// Query params: type=logo|logo_collapsed|loading_gif|welcome_logo|narration|bgm|video|dashboard_icon|icon_*|info_marker_icon|etc
// Body (optional via query): oldUrl — the current URL to delete/replace
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const { type, oldUrl } = req.query;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file provided" });

    const ext = file.originalname.split(".").pop().toLowerCase();
    const ts = Date.now();
    let bucketPath;

    // Map type to Supabase folder structure
    switch (type) {
      case "logo":
        bucketPath = `logos/logo_${ts}.${ext}`;
        break;
      case "logo_collapsed":
        bucketPath = `logos/logo_collapsed_${ts}.${ext}`;
        break;
      case "loading_gif":
        bucketPath = `logos/loading_${ts}.${ext}`;
        break;
      case "welcome_logo":
        bucketPath = `logos/welcome_${ts}.${ext}`;
        break;
      case "narration":
        bucketPath = `audios/sidebar/narration_${ts}.${ext}`;
        break;
      case "bgm":
        bucketPath = `audios/sidebar/bgm_${ts}.${ext}`;
        break;
      case "video":
        bucketPath = `videos/campus_${ts}.${ext}`;
        break;
      case "dashboard_icon":
        bucketPath = `icons/sidebar/dashboard_${ts}.${ext}`;
        break;
      case "info_marker_icon":
        bucketPath = `icons/info_modal/info_marker_${ts}.${ext}`;
        break;
      default:
        // For icon_* types (sidebar, info modal, etc)
        if (type && type.startsWith("icon_")) {
          // e.g. icon_bgm_url → icons/sidebar/bgm.png
          const iconName = type.replace(/^icon_/, "");
          bucketPath = `icons/sidebar/${iconName}_${ts}.${ext}`;
        } else {
          return res.status(400).json({ error: "Invalid upload type" });
        }
    }

    // Delete the old file from Supabase if oldUrl is provided (replace, not add)
    if (oldUrl) {
      const oldPath = bucketPathFromUrl(oldUrl);
      if (oldPath) {
        await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
      }
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(bucketPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) return res.status(500).json({ error: error.message });

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(bucketPath);

    res.json({ url: data.publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET settings (frontend fetches this on load)
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findById("site_settings");

    // If no settings document exists yet, create one with defaults
    if (!settings) {
      settings = await Settings.create({ _id: "site_settings" });
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT settings (admin updates any field)
router.put("/", verifyToken, async (req, res) => {
  try {
    const settings = await Settings.findByIdAndUpdate(
      "site_settings",
      { $set: req.body },
      { returnDocument: "after", upsert: true, runValidators: true },
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
