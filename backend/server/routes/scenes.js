import express from "express";
import multer from "multer";
import Scene from "../models/Scenes.js";
import { verifyToken } from "../middleware/auth.js";
import { supabase, BUCKET_NAME } from "../config/supabase.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
});

// GET all scenes (used by VirtualTourPlugin to load all nodes
// and by sidebar to build submenu lists)
router.get("/", async (req, res) => {
  try {
    const scenes = await Scene.find({});
    res.json(scenes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET scenes filtered by campus and/or category
// Supports comma-separated values: /api/scenes/filter?category=buildings,facilities
router.get("/filter", async (req, res) => {
  try {
    const { campus, category } = req.query;
    const filter = {};
    if (campus) filter.campus = { $in: campus.split(",").map((c) => c.trim()) };
    if (category)
      filter.category = { $in: category.split(",").map((c) => c.trim()) };
    const scenes = await Scene.find(filter);
    res.json(scenes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one scene by ID (used by info modal to load modal content)
router.get("/:id", async (req, res) => {
  try {
    const scene = await Scene.findById(req.params.id);
    if (!scene) return res.status(404).json({ error: "Scene not found" });
    res.json(scene);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a new scene (admin)
router.post("/", verifyToken, async (req, res) => {
  try {
    const scene = new Scene(req.body);
    await scene.save();
    res.status(201).json(scene);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update a scene (admin)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const scene = await Scene.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: "after", runValidators: true },
    );
    if (!scene) return res.status(404).json({ error: "Scene not found" });
    res.json(scene);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a scene (admin)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const scene = await Scene.findByIdAndDelete(req.params.id);
    if (!scene) return res.status(404).json({ error: "Scene not found" });
    res.json({ message: "Scene deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: extract bucket path from a Supabase public URL
const SUPABASE_PUBLIC_PREFIX = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.BUCKET_NAME || "virtual-tour"}/`;
function bucketPathFromUrl(url) {
  if (!url || !url.startsWith(SUPABASE_PUBLIC_PREFIX)) return null;
  return decodeURIComponent(url.slice(SUPABASE_PUBLIC_PREFIX.length));
}

// POST upload a file for a scene (admin)
// Query params: type=panorama|marker_icon|gallery|audio  &markerId=xxx (for marker_icon)
// Body (optional via query): oldUrl — the current URL to delete/replace
router.post(
  "/:id/upload",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const { type, markerId, oldUrl } = req.query;
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file provided" });

      const scene = await Scene.findById(req.params.id);
      if (!scene) return res.status(404).json({ error: "Scene not found" });

      const ext = file.originalname.split(".").pop().toLowerCase();
      const ts = Date.now();
      const campus = scene.campus; // "east", "west", or "both"
      const category = scene.category; // "buildings", "facilities", etc.
      const sceneId = scene._id; // e.g. "JFH", "Gate 1"
      let bucketPath;

      // Mirror the existing Supabase folder hierarchy:
      //   panoramas  → images/{campus}/{category}/{sceneId}.webp
      //   markers    → images/markers/{campus}/{category}/{sceneId}/{file}.webp
      //   gallery    → images/info_modal_gallery/{campus}/{category}/{sceneId}/{file}.ext
      //   audio      → audios/info_modal/{campus}/{category}/{sceneId}.mp3
      switch (type) {
        case "panorama":
          bucketPath = `images/${campus}/${category}/${sceneId}_${ts}.${ext}`;
          break;
        case "marker_icon":
          if (!markerId)
            return res.status(400).json({ error: "markerId required" });
          bucketPath = `images/markers/${campus}/${category}/${sceneId}/${markerId}_${ts}.${ext}`;
          break;
        case "gallery":
          bucketPath = `images/info_modal_gallery/${campus}/${category}/${sceneId}/${sceneId}_${ts}.${ext}`;
          break;
        case "audio":
          bucketPath = `audios/info_modal/${campus}/${category}/${sceneId}_${ts}.${ext}`;
          break;
        default:
          return res.status(400).json({ error: "Invalid upload type" });
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
  },
);

// DELETE remove a file from Supabase storage (for gallery image removal)
router.delete("/:id/upload", verifyToken, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url)
      return res.status(400).json({ error: "url query param required" });

    const oldPath = bucketPathFromUrl(url);
    if (!oldPath)
      return res.status(400).json({ error: "Invalid Supabase URL" });

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([oldPath]);
    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: "File deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
