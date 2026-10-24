(function () {
    'use strict';

    const body = document.body;
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    body.classList.add('js-ready');

    /* ---------- Splash / intro layer ---------- */
    const splash = document.getElementById('splash');

    if (splash) {
        let splashSeen = false;

        try {
            splashSeen = sessionStorage.getItem('nn-splash-seen') === '1';
        } catch (error) {
            /* Unavailable storage: treat as a first visit. */
        }

        if (splashSeen) {
            splash.remove();
            root.classList.remove('splash-pending');
        } else {
            let leaving = false;

            const onKey = (event) => {
                if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
                    event.preventDefault();
                    dismissSplash();
                }
            };

            const dismissSplash = () => {
                if (leaving) return;
                leaving = true;

                try {
                    sessionStorage.setItem('nn-splash-seen', '1');
                } catch (error) {
                    /* Ignore. */
                }

                document.removeEventListener('keydown', onKey);

                if (reduceMotion) {
                    root.classList.remove('splash-pending');
                    splash.remove();
                    return;
                }

                body.classList.add('is-splash-entering');
                splash.classList.add('is-leaving');
                root.classList.remove('splash-pending');
                window.setTimeout(() => splash.remove(), 1700);
                window.setTimeout(() => body.classList.remove('is-splash-entering'), 2200);
            };

            splash.setAttribute('tabindex', '-1');
            splash.focus({ preventScroll: true });
            splash.addEventListener('click', dismissSplash, { once: true });
            document.addEventListener('keydown', onKey);
        }
    }

    /* ---------- Theme ---------- */
    const toggle = document.querySelector('.theme-toggle');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const themeLabel = toggle ? toggle.querySelector('.theme-label') : null;

    function readTheme() {
        try {
            return localStorage.getItem('nn-theme');
        } catch (error) {
            return null;
        }
    }

    function storeTheme(value) {
        try {
            localStorage.setItem('nn-theme', value);
        } catch (error) {
            /* Storage can be unavailable in private contexts. */
        }
    }

    function syncTheme(isDark) {
        body.classList.toggle('dark', isDark);
        if (themeMeta) themeMeta.setAttribute('content', isDark ? '#101114' : '#F5F6F8');
        if (toggle) {
            toggle.setAttribute('aria-pressed', String(isDark));
            toggle.setAttribute('aria-label', isDark ? '切换到浅色模式' : '切换到深色模式');
            toggle.title = isDark ? '切换到浅色模式' : '切换到深色模式';
        }
        if (themeLabel) {
            themeLabel.textContent = isDark ? '浅色模式' : '深色模式';
        }
    }

    syncTheme(body.classList.contains('dark') || readTheme() === 'dark');

    if (toggle) {
        toggle.addEventListener('click', () => {
            const isDark = !body.classList.contains('dark');
            syncTheme(isDark);
            storeTheme(isDark ? 'dark' : 'light');
        });
    }

    window.addEventListener('storage', (event) => {
        if (event.key === 'nn-theme') syncTheme(event.newValue === 'dark');
    });

    /* ---------- Scroll reveal ---------- */
    const revealItems = document.querySelectorAll('.reveal');

    if (!reduceMotion && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        revealItems.forEach((el, index) => {
            el.style.transitionDelay = `${Math.min(index * 55, 280)}ms`;
            observer.observe(el);
        });
    } else {
        revealItems.forEach((el) => el.classList.add('is-visible'));
    }

    /* ---------- Sidebar collapse ---------- */
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const smallScreen = window.matchMedia('(max-width: 900px)');

    if (sidebar && sidebarToggle) {
        const STORAGE_KEY = 'nn-sidebar-collapsed';
        let stored = null;

        try {
            stored = localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            /* Storage can be unavailable in private contexts. */
        }

        const setCollapsed = (collapsed) => {
            body.classList.toggle('is-collapsed', collapsed);
            sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
            const label = collapsed ? '展开侧边栏' : '收起侧边栏';
            sidebarToggle.setAttribute('aria-label', label);
            sidebarToggle.title = label;
        };

        setCollapsed(smallScreen.matches ? true : stored === 'true');

        sidebarToggle.addEventListener('click', () => {
            const next = !body.classList.contains('is-collapsed');
            stored = String(next);
            setCollapsed(next);
            try {
                localStorage.setItem(STORAGE_KEY, stored);
            } catch (error) {
                /* ignore */
            }
        });

        smallScreen.addEventListener('change', (event) => {
            setCollapsed(event.matches ? true : stored === 'true');
        });
    }

})();
