// Check if user is auntheticated (did they login yet?)
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

// Check if user logged out (did they logout yet?)
const isNotAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.status(200).json({
            success: false,
            message: 'Already logged in.',
            redirect: '/admin/a_dashboard.html'
        });
    }
    return next();
};

module.exports = { isAuthenticated, isNotAuthenticated };