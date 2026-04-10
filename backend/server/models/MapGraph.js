import mongoose from 'mongoose';

const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    buildingId: { type: String, default: null }
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    weight: { type: Number, required: true },
    type: { type: String, enum: ['both', 'one-way'], default: 'both' },
    direction: { type: String, enum: ['from→to', 'to→from'], default: null }
}, { _id: false });

const MapGraphSchema = new mongoose.Schema({
    nodes: { type: [NodeSchema], default: [] },
    edges: { type: [EdgeSchema], default: [] }
}, { timestamps: true });

export default mongoose.model('MapGraph', MapGraphSchema);