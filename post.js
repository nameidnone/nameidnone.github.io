(function() {
    const article = document.getElementById('postArticle');
    const metaDiv = document.getElementById('postMeta');
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    async function loadPost() {
        try {
            const indexRes = await fetch('posts/index.json');
            if (!indexRes.ok) throw new Error('无法加载索引');
            const posts = await indexRes.json();
            const post = postId ? posts.find(p => p.id === postId) : posts[0];
            if (!post) throw new Error('文章不存在');
            document.title = `${post.title} - NAMEIDNONE`;
            
            // 加载具体文章文件（假设每个文章有单独文件，或内容在 index 中？这里演示从 index 中获取 content）
            // 实际上 index.json 可以包含 content，也可以只包含元数据，我们选择包含 content 便于演示
            // 若内容较大，建议将 content 放在单独文件中，此处假设 index.json 中每条记录包含 content 字段
            if (!post.content) {
                // 如果 index.json 不含 content，可以按 id 加载 posts/[id].json
                const postRes = await fetch(`posts/${post.id}.json`);
                if (!postRes.ok) throw new Error('文章内容加载失败');
                const fullPost = await postRes.json();
                post.content = fullPost.content || '暂无内容';
            }
            renderPost(post);
        } catch (error) {
            article.innerHTML = `<div class="loading-state">文章加载失败：${error.message}</div>`;
            console.error(error);
        }
    }

    function renderPost(post) {
        article.innerHTML = `
            <h1>${post.title}</h1>
            <span class="date">${formatDate(post.date)}</span>
            <div class="content">${marked.parse(post.content)}</div>
        `;
        if (metaDiv) {
            metaDiv.innerHTML = `
                <p><strong>标签：</strong>${(post.tags || []).map(tag => `<span class="post-tag">${tag}</span>`).join(' ')}</p>
                <p><strong>日期：</strong>${formatDate(post.date)}</p>
            `;
        }
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    loadPost();
})();
