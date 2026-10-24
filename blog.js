(function () {
    'use strict';

    const postGrid = document.getElementById('postGrid');
    const searchInput = document.getElementById('searchInput');
    const tagFilter = document.getElementById('tagFilter');
    const pagination = document.getElementById('pagination');
    const postCountSpan = document.getElementById('postCount');
    const tagCountSpan = document.getElementById('tagCount');

    const postsPerPage = 6;
    const indexCandidates = ['posts/index.json', 'index.json'];

    let allPosts = [];
    let filteredPosts = [];
    let currentTag = 'all';
    let currentPage = 1;

    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));

    function formatDate(dateValue) {
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return String(dateValue ?? '');
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    async function loadIndex() {
        for (const url of indexCandidates) {
            try {
                const response = await fetch(url, { cache: 'no-cache' });
                if (!response.ok) continue;
                const data = await response.json();
                if (Array.isArray(data)) return data;
            } catch (error) {
                /* Try the next candidate. */
            }
        }
        throw new Error('无法加载文章索引');
    }

    async function loadPosts() {
        try {
            allPosts = await loadIndex();
            allPosts.sort((a, b) => {
                const aTime = new Date(a.date).getTime() || 0;
                const bTime = new Date(b.date).getTime() || 0;
                return bTime - aTime;
            });
            populateTagFilter();
            updateStats();
            applyFilter();
        } catch (error) {
            console.error(error);
            if (postGrid) {
                postGrid.innerHTML = '<div class="empty-state">文章加载失败 · 请检查 posts/index.json 是否存在</div>';
            }
            if (pagination) pagination.innerHTML = '';
        }
    }

    function populateTagFilter() {
        if (!tagFilter) return;

        const tags = new Set();
        allPosts.forEach((post) => {
            if (Array.isArray(post.tags)) {
                post.tags.forEach((tag) => tags.add(String(tag)));
            }
        });

        const sortedTags = Array.from(tags).sort((a, b) => a.localeCompare(b, 'zh-CN'));

        tagFilter.innerHTML = '<button class="tag-btn active" type="button" data-tag="all" aria-pressed="true">全部</button>';

        sortedTags.forEach((tag) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'tag-btn';
            button.dataset.tag = tag;
            button.setAttribute('aria-pressed', 'false');
            button.textContent = tag;
            tagFilter.appendChild(button);
        });

        if (tagCountSpan) tagCountSpan.textContent = sortedTags.length;
    }

    function updateStats() {
        if (postCountSpan) postCountSpan.textContent = allPosts.length;
    }

    function applyFilter() {
        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

        filteredPosts = allPosts.filter((post) => {
            const tags = Array.isArray(post.tags) ? post.tags : [];
            const matchesTag = currentTag === 'all' || tags.includes(currentTag);
            const haystack = [
                post.title,
                post.excerpt,
                tags.join(' ')
            ].filter(Boolean).join(' ').toLowerCase();
            const matchesSearch = !query || haystack.includes(query);
            return matchesTag && matchesSearch;
        });

        currentPage = 1;
        renderPosts();
        renderPagination();
    }

    function renderPosts() {
        if (!postGrid) return;

        const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));
        if (currentPage > totalPages) currentPage = totalPages;

        if (filteredPosts.length === 0) {
            postGrid.innerHTML = '<div class="empty-state">没有匹配的文章</div>';
            return;
        }

        const start = (currentPage - 1) * postsPerPage;
        const pagePosts = filteredPosts.slice(start, start + postsPerPage);

        postGrid.innerHTML = '';

        pagePosts.forEach((post) => {
            const card = document.createElement('article');
            const tags = Array.isArray(post.tags) ? post.tags : [];
            const title = post.title || '无标题';
            const id = post.id || '';

            card.className = 'post-card reveal is-visible';
            card.innerHTML = `
                <div class="post-card-top">
                    <time class="post-date" datetime="${escapeHtml(post.date || '')}">${escapeHtml(formatDate(post.date))}</time>
                    <span class="post-arrow" aria-hidden="true">↗</span>
                </div>
                <h3><a href="post.html?id=${encodeURIComponent(id)}">${escapeHtml(title)}</a></h3>
                <p class="post-excerpt">${escapeHtml(post.excerpt || '')}</p>
                <div class="post-tags">${tags.map((tag) => `<span class="post-tag">${escapeHtml(tag)}</span>`).join('')}</div>
            `;

            postGrid.appendChild(card);
        });
    }

    function renderPagination() {
        if (!pagination) return;

        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        pagination.innerHTML = '';
        if (totalPages <= 1) return;

        const createButton = (label, onClick, options = {}) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = label;
            if (options.className) button.className = options.className;
            if (options.disabled) button.disabled = true;
            if (options.ariaLabel) button.setAttribute('aria-label', options.ariaLabel);
            if (options.current) button.setAttribute('aria-current', 'page');
            button.addEventListener('click', onClick);
            pagination.appendChild(button);
        };

        createButton('← 前页', () => {
            if (currentPage > 1) {
                currentPage -= 1;
                renderPosts();
                renderPagination();
            }
        }, {
            disabled: currentPage === 1,
            ariaLabel: '上一页'
        });

        for (let page = 1; page <= totalPages; page += 1) {
            createButton(String(page), () => {
                currentPage = page;
                renderPosts();
                renderPagination();
            }, {
                className: page === currentPage ? 'active' : '',
                current: page === currentPage,
                ariaLabel: `第 ${page} 页`
            });
        }

        createButton('后页 →', () => {
            if (currentPage < totalPages) {
                currentPage += 1;
                renderPosts();
                renderPagination();
            }
        }, {
            disabled: currentPage === totalPages,
            ariaLabel: '下一页'
        });
    }

    /* ---------- Events ---------- */
    if (searchInput) {
        searchInput.addEventListener('input', applyFilter);

        searchInput.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            searchInput.value = '';
            searchInput.blur();
            applyFilter();
        });
    }

    if (tagFilter) {
        tagFilter.addEventListener('click', (event) => {
            const button = event.target.closest('.tag-btn');
            if (!button) return;

            tagFilter.querySelectorAll('.tag-btn').forEach((item) => {
                const isActive = item === button;
                item.classList.toggle('active', isActive);
                item.setAttribute('aria-pressed', String(isActive));
            });

            currentTag = button.dataset.tag || 'all';
            applyFilter();
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key !== '/' || !searchInput) return;
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(activeTag)) return;
        event.preventDefault();
        searchInput.focus();
    });

    loadPosts();
})();
