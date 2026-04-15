import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
    const token = req.cookies.token;

    const isApiRequest = req.headers['accept']?.includes('application/json') || 
                         req.headers['content-type']?.includes('application/json') ||
                         req.headers['content-type']?.includes('multipart/form-data');

    if (!token) {
        return isApiRequest
            ? res.status(401).json({ error: 'Unauthorized' })
            : res.redirect('/admin/login.html');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return isApiRequest
            ? res.status(401).json({ error: 'Unauthorized' })
            : res.redirect('/admin/login.html');
    }
}