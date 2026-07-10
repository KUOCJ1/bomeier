// Bo Mei Er - Journal dynamic posts
// If journal_posts exists and contains published rows, render them here.

(function() {
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveImage(path) {
    if (!path) return '';
    if (/^https?:\/\//.test(path) || /^data:/.test(path) || /^\/\//.test(path) || path.indexOf('images/') === 0 || path.indexOf('../') === 0 || path.indexOf('/') === 0) {
      return path;
    }
    return 'images/products/' + path;
  }

  function renderParagraphs(content) {
    var text = String(content || '').trim();
    if (!text) return '<p>尚未提供內容。</p>';
    return text
      .split(/\n\s*\n/)
      .map(function(block) {
        return '<p>' + escapeHtml(block).replace(/\n/g, '<br>') + '</p>';
      })
      .join('');
  }

  function toggleArticle(articleId) {
    var article = document.getElementById(articleId);
    if (!article) return;
    article.classList.toggle('open');
    article.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  window.toggleArticle = window.toggleArticle || toggleArticle;

  document.addEventListener('DOMContentLoaded', function() {
    var grid = document.getElementById('journal-grid');
    var dynamic = document.getElementById('journal-dynamic-articles');
    if (!grid || !dynamic || typeof initSupabase !== 'function') return;

    initSupabase().then(function(client) {
      return client.from('journal_posts').select('*').eq('status', 'published').order('featured', { ascending: false }).order('published_at', { ascending: false }).order('sort_order', { ascending: true });
    }).then(function(res) {
      var posts = (res && res.data) ? res.data : [];
      if (!posts.length) return;

      grid.innerHTML = posts.map(function(post) {
        var id = 'journal-post-' + post.id;
        var badge = post.featured ? '精選' : (post.category || '文章');
        return '<article class="journal-card clickable" onclick="toggleArticle(\'' + id + '\')">' +
          '<div class="journal-card-image">' +
            (post.cover_image ? '<img src="' + escapeHtml(resolveImage(post.cover_image)) + '" alt="' + escapeHtml(post.title || '') + '" loading="lazy">' : '<div style="width:100%;height:100%;background:#F8F3EE;"></div>') +
            '<span class="journal-card-badge">' + escapeHtml(badge) + '</span>' +
          '</div>' +
          '<div class="journal-card-body">' +
            '<div class="journal-date">' + escapeHtml(post.published_at || '') + '</div>' +
            '<h3>' + escapeHtml(post.title || '') + '</h3>' +
            '<p>' + escapeHtml(post.excerpt || '') + '</p>' +
            '<span class="read-more">閱讀全文 →</span>' +
          '</div>' +
        '</article>';
      }).join('');

      dynamic.innerHTML = posts.map(function(post) {
        var id = 'journal-post-' + post.id;
        return '<article class="journal-article" id="' + id + '">' +
          '<div class="journal-article-content">' +
            '<h3>' + escapeHtml(post.title || '') + '</h3>' +
            '<div class="article-meta">' + escapeHtml((post.published_at || '') + ' · ' + (post.category || '網誌')) + '</div>' +
            renderParagraphs(post.content) +
            '<button class="journal-article-toggle" onclick="toggleArticle(\'' + id + '\')">收起文章 ↑</button>' +
          '</div>' +
        '</article>';
      }).join('');

      document.querySelectorAll('.journal-article').forEach(function(article) {
        article.style.display = 'none';
      });
      document.querySelectorAll('.journal-article').forEach(function(article) {
        article.classList.remove('open');
      });
      dynamic.querySelectorAll('.journal-article').forEach(function(article) {
        article.style.display = 'none';
      });
      window.toggleArticle = function(articleId) {
        var article = document.getElementById(articleId);
        if (!article) return;
        article.style.display = article.classList.contains('open') ? 'none' : 'block';
        article.classList.toggle('open');
        article.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    }).catch(function(err) {
      console.warn('journal_posts load failed:', err);
    });
  });
})();
