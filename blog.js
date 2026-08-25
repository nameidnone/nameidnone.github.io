(function() {
    const postGrid = document.getElementById('postGrid');
    const loadingState = document.getElementById('loadingState');
    const searchInput = document.getElementById('searchInput');
    const tagFilter = document.getElementById('tagFilter');
    const pagination = document.getElementById('pagination');
    const postCountSpan = document.getElementById('postCount');
    const tagCountSpan = document.getElementById('tagCount');

    let allPosts = [];
    let filteredPosts = [];
    let currentTag = 'all';
    let currentPage = 1;
    const postsPerPage = 6;

    // 加载文章索引
    async function loadPosts() {
        try {
            const response = await fetch('posts/index.json');
            if (!response.ok) throw new Error('无法加载索引');
            allPosts = await response.json();
            // 按日期排序（新到旧）
            allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
            populateTagFilter();
            updateStats();
            applyFilter();
        } catch (error) {
            postGrid.innerHTML = '<div class="loading-state">文章加载失败，请检查 posts/index.json 是否存在</div>';
            console.error(error);
        }
    }

    function populateTagFilter() {
        const tagsSet = new Set();
        allPosts.forEach(post => post.tags?.forEach(tag => tagsSet.add(tag)));
        const tags = Array.from(tagsSet).sort();
        tagFilter.innerHTML = '<button class="tag-btn active" data-tag="all">全部</button>';
        tags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'tag-btn';
            btn.dataset.tag = tag;
            btn.textContent = tag;
            tagFilter.appendChild(btn);
        });
        tagCountSpan.textContent = tags.length;
    }

    function updateStats() {
        postCountSpan.textContent = allPosts.length;
    }

    function applyFilter() {
        const query = searchInput.value.toLowerCase().trim();
        filteredPosts = allPosts.filter(post => {
            const matchesTag = currentTag === 'all' || (post.tags && post.tags.includes(currentTag));
            const matchesSearch = !query || 
                post.title.toLowerCase().includes(query) ||
                (post.excerpt && post.excerpt.toLowerCase().includes(query)) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)));
            return matchesTag && matchesSearch;
        });
        currentPage = 1;
        renderPosts();
        renderPagination();
    }

    function renderPosts() {
        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        if (filteredPosts.length === 0) {
            postGrid.innerHTML = '<div class="loading-state">没有匹配的文章</div>';
            return;
        }
        const start = (currentPage - 1) * postsPerPage;
        const end = start + postsPerPage;
        const pagePosts = filteredPosts.slice(start, end);
        postGrid.innerHTML = '';
        pagePosts.forEach(post => {
            const card = document.createElement('article');
            card.className = 'post-card reveal is-visible'; // 直接可见，避免延迟
            card.innerHTML = `
                <h3><a href="post.html?id=${encodeURIComponent(post.id)}">${post.title}</a></h3>
                <span class="post-date">${formatDate(post.date)}</span>
                <p class="post-excerpt">${post.excerpt || ''}</p>
                <div class="post-tags">${(post.tags || []).map(tag => `<span class="post-tag">${tag}</span>`).join('')}</div>
            `;
            postGrid.appendChild(card);
        });
    }

    function renderPagination() {
        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        pagination.innerHTML = '';
        if (totalPages <= 1) return;
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← 前页';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => { currentPage--; renderPosts(); renderPagination(); });
        pagination.appendChild(prevBtn);
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            pageBtn.addEventListener('click', () => { currentPage = i; renderPosts(); renderPagination(); });
            pagination.appendChild(pageBtn);
        }
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '后页 →';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => { currentPage++; renderPosts(); renderPagination(); });
        pagination.appendChild(nextBtn);
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // 事件监听
    searchInput.addEventListener('input', applyFilter);
    tagFilter.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag-btn')) {
            document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentTag = e.target.dataset.tag;
            applyFilter();
        }
    });

    // 初始化
    loadPosts();
})();
