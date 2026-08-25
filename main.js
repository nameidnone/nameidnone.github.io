(function() {
    // 主题切换
    const toggle = document.querySelector('.theme-toggle');
    const body = document.body;
    const savedTheme = localStorage.getItem('nn-theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark');
        toggle.textContent = '白/黑';
    } else {
        toggle.textContent = '黑/白';
    }
    toggle.addEventListener('click', () => {
        body.classList.toggle('dark');
        const isDark = body.classList.contains('dark');
        toggle.textContent = isDark ? '白/黑' : '黑/白';
        localStorage.setItem('nn-theme', isDark ? 'dark' : 'light');
    });

    // 滚动出现动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach((el, index) => {
        el.style.transitionDelay = `${Math.min(index * 60, 300)}ms`;
        observer.observe(el);
    });

    // 光标光晕
    const glow = document.getElementById('cursorGlow');
    if (glow) {
        let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0, rafId = null;
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!rafId) rafId = requestAnimationFrame(updateGlow);
        });
        function updateGlow() {
            glowX += (mouseX - glowX) * 0.12;
            glowY += (mouseY - glowY) * 0.12;
            glow.style.left = glowX + 'px';
            glow.style.top = glowY + 'px';
            if (Math.abs(mouseX - glowX) > 0.5 || Math.abs(mouseY - glowY) > 0.5) {
                rafId = requestAnimationFrame(updateGlow);
            } else rafId = null;
        }
        document.addEventListener('mouseleave', () => glow.style.opacity = '0');
        document.addEventListener('mouseenter', () => glow.style.opacity = '1');
    }

    // 平滑滚动锚点（带偏移）
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                const headerOffset = 70;
                const elementPosition = targetEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    });
})();
