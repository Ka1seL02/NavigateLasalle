import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const requireSuperAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Not authenticated.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);

        if (!admin || admin.role !== 'superadmin') {
            return res.status(403).json({ message: 'Access denied.' });
        }

        req.admin = admin;
        next();

    } catch (error) {
        res.status(401).json({ message: 'Not authenticated.' });
    }
};

export default requireSuperAdmin;