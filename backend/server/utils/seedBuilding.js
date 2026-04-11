import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Building from '../models/Building.js';

dotenv.config();

const buildings = [
    // ====== BUILDINGS — EAST ======
    { name: "College of Science", dataId: "COS", category: "building", shape: { type: "rect", x: 25, y: 701, width: 40, height: 281 } },
    { name: "Ayuntamiento de Gonzales", dataId: "ADG", category: "building", shape: { type: "rect", x: 103, y: 766, width: 98, height: 212 } },
    { name: "Aklatang Emilio Aguinaldo", dataId: "AEA", category: "building", shape: { type: "rect", x: 153, y: 531, width: 141, height: 89 } },
    { name: "College of Tourism and Hospitality Management", dataId: "CTHM", category: "building", shape: { type: "rect", x: 463, y: 741, width: 124, height: 153 } },
    { name: "Information and Communications Technology Center", dataId: "ICTC", category: "building", shape: { type: "rect", x: 592, y: 880, width: 50, height: 98 } },
    { name: "Julian Felipe Hall", dataId: "JFH", category: "building", shape: { type: "rect", x: 307, y: 701, width: 42, height: 254 } },
    { name: "Lasallian Community Development Center", dataId: "LCDC", category: "building", shape: { type: "rect", x: 268, y: 633, width: 100, height: 30 } },
    { name: "Ladies' and Men's Dormitory Complex", dataId: "LMDC", category: "building", shape: { type: "rect", x: 253, y: 28, width: 172, height: 273 } },
    { name: "La Porteria de San Benildo", dataId: "LPDSB", category: "building", shape: { type: "rect", x: 610, y: 1016, width: 32, height: 48 } },
    { name: "Mariano Alvarez Hall", dataId: "MAH", category: "building", shape: { type: "rect", x: 463, y: 917, width: 105.87, height: 28.43 } },
    { name: "Museo de La Salle", dataId: "MDLS", category: "building", shape: { type: "rect", x: 272, y: 343, width: 124, height: 67 } },
    { name: "Paulo Campos Hall", dataId: "PCH", category: "building", shape: { type: "rect", x: 239, y: 701, width: 47, height: 277 } },
    { name: "Residencia San Miguel", dataId: "RSM", category: "building", shape: { type: "rect", x: 103, y: 531, width: 44, height: 110 } },
    { name: "Severino de las Alas Hall", dataId: "SDLAH", category: "building", shape: { type: "rect", x: 663, y: 480, width: 85, height: 26.38, rotate: -48.52 } },
    { name: "Tanghalang Julian Felipe", dataId: "TJF", category: "building", shape: { type: "rect", x: 307, y: 959, width: 42, height: 19 } },
    { name: "Trailer Classrooms", dataId: "TC", category: "building", shape: { type: "rect", x: 481, y: 955, width: 67, height: 23 } },

    // ====== BUILDINGS — WEST ======
    { name: "Bahay Pag-Asa", dataId: "BPA", category: "building", shape: { type: "rect", x: 1604, y: 27, width: 78, height: 105 } },
    { name: "College of Business Administration and Accountancy", dataId: "CBAA", category: "building", shape: { type: "rect", x: 1079, y: 37, width: 151, height: 95 } },
    { name: "College of Engineering, Architecture, and Technology", dataId: "CEAT", category: "building", shape: { type: "rect", x: 869, y: 22, width: 167, height: 110 } },
    { name: "Candido Tirona Hall (1)", dataId: "CTH-1", category: "building", shape: { type: "rect", x: 923, y: 271, width: 150, height: 27 } },
    { name: "Candido Tirona Hall (2)", dataId: "CTH-2", category: "building", shape: { type: "rect", x: 1008, y: 222, width: 88, height: 27 } },
    { name: "Francisco Barzaga Hall (POLCA Office)", dataId: "FBH", category: "building", shape: { type: "rect", x: 752, y: 303, width: 111, height: 44 } },
    { name: "Felipe Calderon Hall", dataId: "FCH", category: "building", shape: { type: "rect", x: 746, y: 271, width: 173, height: 27 } },
    { name: "Gregoria Montoya Hall", dataId: "GMH", category: "building", shape: { type: "rect", x: 895, y: 171, width: 105, height: 79 } },
    { name: "Grandstand", dataId: "GS", category: "building", shape: { type: "rect", x: 1350, y: 58, width: 130, height: 74 } },
    { name: "High School Building", dataId: "HS", category: "building", shape: { type: "rect", x: 1318, y: 387, width: 196, height: 132 } },
    { name: "Ladislao Diwa Hall", dataId: "LDH", category: "building", shape: { type: "rect", x: 715, y: 223, width: 122, height: 27 } },
    { name: "Mariano Trias Hall (1)", dataId: "MTH-1", category: "building", shape: { type: "rect", x: 1088, y: 189, width: 108, height: 27 } },
    { name: "Mariano Trias Hall (2)", dataId: "MTH-2", category: "building", shape: { type: "rect", x: 1108, y: 222, width: 71, height: 27 } },
    { name: "Retreat and Conference Center", dataId: "RCC", category: "building", shape: { type: "rect", x: 1720, y: 27, width: 69, height: 105 } },
    { name: "Santiago Alvarez Hall", dataId: "SAH", category: "building", shape: { type: "rect", x: 1046, y: 94, width: 27, height: 38 } },
    { name: "Ugnayang La Salle", dataId: "ULS", category: "building", shape: { type: "rect", x: 1611, y: 237, width: 71, height: 110 } },
    { name: "Vito Belarmino Hall", dataId: "VBH", category: "building", shape: { type: "rect", x: 715, y: 88, width: 130, height: 44 } },

    // ====== FACILITIES — EAST ======
    { name: "Aklatang Emilio Aguinaldo - Electronic Resource Center", dataId: "AEA-ERC", category: "facility", shape: { type: "rect", x: 302, y: 531, width: 72, height: 69 } },
    { name: "Cafe Museo", dataId: "CM", category: "facility", shape: { type: "rect", x: 400, y: 354, width: 25.24, height: 42 } },
    { name: "Hotel Rafael", dataId: "HR", category: "facility", shape: { type: "rect", x: 572, y: 590, width: 70.17, height: 133.38 } },
    { name: "Mila's Diner", dataId: "MD", category: "facility", shape: { type: "rect", x: 374, y: 611, width: 51, height: 52 } },
    { name: "Motor Pool (Transportation Building)", dataId: "MP", category: "facility", shape: { type: "rect", x: 12, y: 1016, width: 53, height: 48 } },
    { name: "University Food Square", dataId: "UFS", category: "facility", shape: { type: "rect", x: 463, y: 171, width: 94, height: 67 } },

    // ====== FACILITIES — WEST ======
    { name: "Kabalikat ng DLSU-D", dataId: "KND", category: "facility", shape: { type: "rect", x: 1008, y: 387, width: 37, height: 38 } },
    { name: "Mariano Trias Hall - Covered Court", dataId: "MTH-CC", category: "facility", shape: { type: "rect", x: 1008, y: 171, width: 67, height: 45 } },
    { name: "Olympic-size Swimming Pool", dataId: "Pool", category: "facility", shape: { type: "rect", x: 1604, y: 170, width: 78, height: 61 } },
    { name: "Security Office", dataId: "SEC", category: "facility", shape: { type: "rect", x: 1223, y: 387, width: 49, height: 55 } },

    // ====== GATES ======
    { name: "Magdalo Gate (Gate 1)", dataId: "G1", category: "gate", shape: { type: "rect", x: 459, y: 1023, width: 41, height: 41 } },
    { name: "Magdiwang Gate (Gate 3)", dataId: "G3", category: "gate", shape: { type: "rect", x: 1878, y: 166, width: 28, height: 71 } },

    // ====== LANDMARKS — EAST ======
    { name: "Batibot (East)", dataId: "Batibot", category: "landmark", shape: { type: "ellipse", cx: 600.5, cy: 202.5, rx: 34.5, ry: 31.5 } },
    { name: "Antonio & Victoria Cojuangco Memorial Chapel", dataId: "Chapel", category: "landmark", shape: { type: "rect", x: 103, y: 448, width: 165, height: 45 } },
    { name: "Kubo (Study Shed)", dataId: "SS", category: "landmark", shape: { type: "rect", x: 387, y: 701, width: 38, height: 219 } },

    // ====== LANDMARKS — WEST ======
    { name: "Batibot (West)", dataId: "Batibot 2", category: "landmark", shape: { type: "ellipse", cx: 813.5, cy: 192, rx: 23.5, ry: 21 } },
    { name: "Track and Oval Field", dataId: "Oval", category: "landmark", shape: { type: "rect", x: 1280, y: 171, width: 270, height: 176, rx: 88, ry: 88 } },

    // ====== PARKING — EAST ======
    { name: "Chapel & MDLS Parking", dataId: "Chapel-MDLS-Parking", category: "parking", shape: { type: "rect", x: 69, y: 343, width: 149, height: 101 } },
    { name: "COS & ADG Parking", dataId: "COS-ADG-Parking", category: "parking", shape: { type: "rect", x: 103, y: 701, width: 98, height: 65 } },
    { name: "G1 & G2 Parking", dataId: "G1-G2-Parking", category: "parking", shape: { type: "rect", x: 504, y: 1016, width: 102, height: 48 } },
    { name: "G1 & G4 Parking", dataId: "G1-G4-Parking", category: "parking", shape: { type: "rect", x: 103, y: 1016, width: 313, height: 48 } },
    { name: "RSM Parking", dataId: "RSM-Parking", category: "parking", shape: { type: "rect", x: 153, y: 644, width: 52, height: 20 } },

    // ====== PARKING — WEST ======
    { name: "CBAA Parking", dataId: "CBAA-Parking", category: "parking", shape: { type: "rect", x: 1234, y: 54, width: 38, height: 78 } },
    { name: "CBAA, MTH & OVL Parking", dataId: "CBAA-MTH-OVL-Parking", category: "parking", shape: { type: "rect", x: 1234, y: 171, width: 38, height: 176 } },
    { name: "FBH Parking", dataId: "FBH-Parking", category: "parking", shape: { type: "rect", x: 775, y: 387, width: 150, height: 38 } },
    { name: "GMH Parking", dataId: "GMH-Parking", category: "parking", shape: { type: "rect", x: 845, y: 171, width: 43, height: 63 } },
    { name: "OVL & ULS Parking", dataId: "OVL-ULS-Parking", category: "parking", shape: { type: "rect", x: 1558, y: 171, width: 38, height: 176 } },
    { name: "ULS Parking", dataId: "ULS-Parking", category: "parking", shape: { type: "rect", x: 1720, y: 171, width: 46, height: 143 } },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        let inserted = 0;
        let skipped = 0;

        for (const building of buildings) {
            const exists = await Building.findOne({ dataId: building.dataId });
            if (exists) {
                console.log(`⏭️ Skipping existing: ${building.dataId}`);
                skipped++;
                continue;
            }
            await Building.create(building);
            console.log(`✅ Seeded: ${building.dataId}`);
            inserted++;
        }

        console.log(`\n🎉 Done! Inserted: ${inserted}, Skipped: ${skipped}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    }
};

seed();