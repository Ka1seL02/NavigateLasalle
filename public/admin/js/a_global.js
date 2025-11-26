// Email masking
function maskEmail(email) {
    const [name, domain] = email.split('@');
    const masked = name[0] + '***' + name.slice(-1);
    return `${masked}@${domain}`;
}

// Custom Date Formatting
function formatDate(dateString) {
    if (!dateString) return false; // Meaning user has not login yet
    const fetchDate = new Date(dateString);
    const currentDate = new Date();
    fetchDate.setHours(0,0,0,0);
    currentDate.setHours(0,0,0,0);

    const diffMs = currentDate - fetchDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Less than a year 
    if (diffDays < 365) {
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays >= 2 && diffDays < 7) return `${diffDays} days ago`;
        
        const weeks = Math.floor(diffDays / 7);
        if (weeks >= 1 && weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;

        // For dates older than 3 weeks but less than a year
        return fetchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return fetchDate.toLocaleDateString('en-GB'); // "dd/mm/yyyy" format
}

// ==================== AUTH CHECK FUNCTIONS ==================== //

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch('/api/accounts/check-session');
        const data = await response.json();
        
        return data.isAuthenticated;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Protect pages that require authentication
async function protectPage() {
    const isAuthenticated = await checkAuth();
    
    if (!isAuthenticated) {
        window.location.href = '/admin/a_login.html';
    }
}

// Redirect if already logged in (for login/register pages)
async function redirectIfAuthenticated() {
    const isAuthenticated = await checkAuth();
    
    if (isAuthenticated) {
        window.location.href = '/admin/a_dashboard.html';
    }
}