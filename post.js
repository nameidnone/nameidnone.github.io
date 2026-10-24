(function () {
    'use strict';

    const article = document.getElementById('postArticle');
    const metaDiv = document.getElementById('postMeta');
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    const indexCandidates = ['posts/index.json', 'index.json'];

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

    function readingTime(content) {
        const text = String(content || '')
            .replace(/```[\s\S]*?```/g, ' ')
            .replace(/[#>*_`~\-[\]()]/g, ' ');
        const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const words = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
        return Math.max(1, Math.ceil((cjk + words) / 350));
    }

    function renderMarkdown(markdown) {
        if (window.marked && typeof window.marked.parse === 'function') {
            return window.marked.parse(markdown || '');
        }

        return String(markdown || '')
            .split(/\n{2,}/)
            .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
            .join('');
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

    async function ensureContent(post) {
        if (post.content) return post;
        if (!post.id) return post;

        try {
            const response = await fetch(`posts/${encodeURIComponent(post.id)}.json`, { cache: 'no-cache' });
            if (!response.ok) return post;
            const fullPost = await response.json();
            return { ...post, ...fullPost };
        } catch (error) {
            return post;
        }
    }

    async function loadPost() {
        if (!article) return;

        try {
            const posts = await loadIndex();
            if (posts.length === 0) throw new Error('还没有文章');

            const post = postId
                ? posts.find((item) => item.id === postId)
                : posts[0];

            if (!post) throw new Error('文章不存在');

            const fullPost = await ensureContent(post);
            renderPost(fullPost);
        } catch (error) {
            console.error(error);
            article.innerHTML = `
                <div class="empty-state">文章加载失败 · ${escapeHtml(error.message)}</div>
                <div class="post-footer">
                    <a class="btn btn-glass" href="blog.html">← 返回博客</a>
                </div>
            `;
            if (metaDiv) metaDiv.innerHTML = '';
        }
    }

    function renderPost(post) {
        const tags = Array.isArray(post.tags) ? post.tags : [];
        const title = post.title || '无标题';
        const dateText = formatDate(post.date);
        const minutes = readingTime(post.content);
        const contentHtml = renderMarkdown(post.content);

        document.title = title;

        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (descriptionMeta && post.excerpt) {
            descriptionMeta.setAttribute('content', post.excerpt);
        }

        article.innerHTML = `
            <header class="post-header">
                <p class="post-kicker">标签占位</p>
                <h1>${escapeHtml(title)}</h1>
                ${tags.length > 0
                    ? `<div class="post-tags">${tags.map((tag) => `<span class="post-tag">${escapeHtml(tag)}</span>`).join('')}</div>`
                    : ''}
            </header>
            <div class="content">${contentHtml}</div>
            <footer class="post-footer">
                <a class="btn btn-glass" href="blog.html">← 返回全部文章</a>
            </footer>
        `;

        if (metaDiv) {
            metaDiv.innerHTML = `
                <time datetime="${escapeHtml(post.date || '')}">${escapeHtml(dateText)}</time>
                <span class="meta-sep" aria-hidden="true">·</span>
                <span>${minutes} 分钟阅读</span>
            `;
        }
    }

    loadPost();
})();
