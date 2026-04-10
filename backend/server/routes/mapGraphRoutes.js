import express from 'express';
import MapGraph from '../models/MapGraph.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/mapgraph — get the graph (or empty if none yet)
router.get('/', async (req, res) => {
    try {
        let graph = await MapGraph.findOne();
        if (!graph) {
            graph = { nodes: [], edges: [] };
        }
        res.json(graph);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch map graph' });
    }
});

// PUT /api/mapgraph — save entire graph (replaces existing)
router.put('/', verifyToken, async (req, res) => {
    try {
        const { nodes, edges } = req.body;

        // Validate node edge connections exist
        const nodeIds = new Set(nodes.map(n => n.id));
        for (const edge of edges) {
            if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
                return res.status(400).json({ error: `Edge references non-existent node` });
            }
        }

        // Validate max 10 edges per node
        const edgeCount = {};
        for (const edge of edges) {
            edgeCount[edge.from] = (edgeCount[edge.from] || 0) + 1;
            edgeCount[edge.to] = (edgeCount[edge.to] || 0) + 1;
            if (edgeCount[edge.from] > 10 || edgeCount[edge.to] > 10) {
                return res.status(400).json({ error: `Node ${edge.from} or ${edge.to} exceeds 10 edge limit` });
            }
        }

        let graph = await MapGraph.findOne();
        if (!graph) {
            graph = new MapGraph({ nodes, edges });
        } else {
            graph.nodes = nodes;
            graph.edges = edges;
        }

        await graph.save();
        res.json({ message: 'Graph saved successfully', graph });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save map graph' });
    }
});

export default router;