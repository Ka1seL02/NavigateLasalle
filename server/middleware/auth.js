// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login.',
        redirect: '/admin/a_login.html'
    });
};

// Middleware to check if user is already logged in (for login/register pages)
const isNotAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.status(200).json({
            success: false,
            message: 'Already logged in.',
            redirect: '/admin/a_dashboard.html' // Change to your dashboard page
        });
    }
    return next();
};

module.exports = { isAuthenticated, isNotAuthenticated };