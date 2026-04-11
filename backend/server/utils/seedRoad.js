import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Building from '../models/Building.js';

dotenv.config();

const roads = [
    // ====== EAST ======
    { name: "AEA Road", dataId: "AEA-Rd.", category: "road", shape: { type: "rect", x: 98, y: 497, width: 333, height: 30 } },
    { name: "AP Road", dataId: "AP-Rd.", category: "road", shape: { type: "rect", x: 205, y: 696, width: 30, height: 287 } },
    { name: "Chapel Road", dataId: "Chapel-Rd.", category: "road", shape: { type: "rect", x: 272, y: 443, width: 30, height: 55 } },
    { name: "Gate 1 Entry", dataId: "G1-Entry", category: "road", shape: { type: "rect", x: 429, y: 1012, width: 30, height: 52 } },
    { name: "Gate 4 Way Road", dataId: "Gate-4-Way-Rd.", category: "road", shape: { type: "rect", x: 69, y: 444, width: 30, height: 620 } },
    { name: "IL Road", dataId: "IL-Rd.", category: "road", shape: { type: "rect", x: 459, y: 982, width: 188, height: 30 } },
    { name: "JPAC Road", dataId: "JPAC-Rd.", category: "road", shape: { type: "rect", x: 98, y: 982, width: 331, height: 30 } },
    { name: "JS Road", dataId: "JS-Rd.", category: "road", shape: { type: "rect", x: 353, y: 696, width: 30, height: 287 } },
    { name: "Lake Avenue", dataId: "Lake-Ave.", category: "road", shape: { type: "rect", x: 429, y: 165, width: 30, height: 816 } },
    { name: "LCDC Road", dataId: "LCDC-Rd.", category: "road", shape: { type: "rect", x: 98, y: 667, width: 333, height: 30 } },
    { name: "Museo Drive", dataId: "Museo-Drive", category: "road", shape: { type: "rect", x: 218, y: 414, width: 213, height: 30 } },
    { name: "Park Trail 1", dataId: "Park-Trail-1", category: "road", shape: { type: "rect", x: 458, y: 243, width: 219, height: 12 } },
    { name: "Park Trail 2", dataId: "Park-Trail-2", category: "road", shape: { type: "rect", x: 532, y: 276.5, width: 177.43, height: 12, rotate: 22.47 } },
    { name: "PC Campos Avenue 1", dataId: "PC-Campos-Ave.-1", category: "road", shape: { type: "rect", x: 646, y: 555.5, width: 30, height: 507.5 } },
    { name: "PC Campos Avenue 2", dataId: "PC-Campos-Ave.-2", category: "road", shape: { type: "rect", x: 647, y: 527, width: 149.3, height: 30, rotate: -21 } },
    { name: "PC Campos Avenue 3", dataId: "PC-Campos-Ave.-3", category: "road", shape: { type: "rect", x: 708, y: 144, width: 30, height: 400, rotate: -19 } },
    { name: "West Avenue 1", dataId: "West-Ave.-1", category: "road", shape: { type: "rect", x: 429, y: 136, width: 801, height: 30 } },

    // ====== WEST ======
    { name: "Acacia Avenue", dataId: "Acacia-Ave.", category: "road", shape: { type: "rect", x: 720, y: 352, width: 510, height: 30 } },
    { name: "Academy Lane", dataId: "Academy-Lane", category: "road", shape: { type: "rect", x: 704, y: 254, width: 497, height: 12 } },
    { name: "Gate 3 Entry", dataId: "G3-Entry", category: "road", shape: { type: "rect", x: 1862, y: 136, width: 44, height: 30 } },
    { name: "GS Drive & PA Road", dataId: "GS-Drive-PA-Rd.", category: "road", shape: { type: "rect", x: 1227, y: 136, width: 461, height: 30 } },
    { name: "Oval Road 1", dataId: "Oval-Rd.-1", category: "road", shape: { type: "rect", x: 1228, y: 352, width: 488, height: 30 } },
    { name: "Oval Road 2", dataId: "Oval-Rd.-2", category: "road", shape: { type: "rect", x: 1686, y: 136, width: 30, height: 217 } },
    { name: "Oval Road 3", dataId: "Oval-Rd.-3", category: "road", shape: { type: "rect", x: 1715, y: 136, width: 118, height: 30 } },
    { name: "PA Road", dataId: "PA-Rd.", category: "road", shape: { type: "rect", x: 1686, y: 27, width: 30, height: 110 } },
    { name: "West Avenue 2", dataId: "West-Ave.-2", category: "road", shape: { type: "rect", x: 1200, y: 165, width: 30, height: 188 } },

    // ====== ROTUNDAS ======
    { name: "Gate 1 Rotunda", dataId: "G1-Rotunda", category: "road", shape: { type: "ellipse", cx: 444, cy: 997, rx: 33, ry: 29 } },
    { name: "Gate 3 Rotunda", dataId: "G3-Rotunda", category: "road", shape: { type: "ellipse", cx: 1850, cy: 150.5, rx: 28, ry: 26.5 } },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        let inserted = 0;
        let skipped = 0;

        for (const road of roads) {
            const exists = await Building.findOne({ dataId: road.dataId });
            if (exists) {
                console.log(`⏭️  Skipped (already exists): ${road.dataId}`);
                skipped++;
                continue;
            }
            await Building.create(road);
            console.log(`✅ Seeded: ${road.dataId}`);
            inserted++;
        }

        console.log(`\n✅ Done! Inserted: ${inserted}, Skipped: ${skipped}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    }
};

seed();