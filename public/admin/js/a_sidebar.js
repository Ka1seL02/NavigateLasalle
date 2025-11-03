document.addEventListener('DOMContentLoaded', () => {
    fetch('a_sidebar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-container').innerHTML = data;

            // Highlight active link
            const currentPage = window.location.pathname.split('/').pop();
            const links = document.querySelectorAll('.sidebar-menu li a');
            links.forEach(link => {
                if (link.getAttribute('href') === currentPage) {
                    link.classList.add('active');
                }
            });

            // Sidebar collapse logic
            const sidebar = document.querySelector('nav');
            const toggle = document.querySelector('.sidebar-toggle');
            if (toggle) {
                toggle.addEventListener('click', () => {
                    sidebar.classList.toggle('collapsed');
                });
            }
        })
        .catch(err => console.error('Sidebar load failed:', err));
});
