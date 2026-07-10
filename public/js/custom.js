// Bo Mei Er — 半訂製菜單 (Custom Order Module)
// 依賴：auth.js, supabase-config.js

var BME_CUSTOM = {
  currentStep: 1,
  totalSteps: 5,
  selections: {
    glassColor: '',
    metalType: '',
    chainLength: '',
    accessoryType: '',
    description: '',
    referenceImage: ''
  },

  init: function() {
    this.renderStep(this.currentStep);
    this.updateProgress();
    this.setupNavigation();
  },

  setupNavigation: function() {
    var self = this;
    document.getElementById('custom-prev-btn').addEventListener('click', function() {
      if (self.currentStep > 1) {
        self.currentStep--;
        self.renderStep(self.currentStep);
        self.updateProgress();
      }
    });
  },

  updateProgress: function() {
    var pct = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
    var bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = pct + '%';
    var stepNum = document.getElementById('step-number');
    if (stepNum) stepNum.textContent = this.currentStep + ' / ' + this.totalSteps;
    var prevBtn = document.getElementById('custom-prev-btn');
    if (prevBtn) prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-flex';
  },

  selectOption: function(group, value) {
    this.selections[group] = value;
    var cards = document.querySelectorAll('.custom-option[data-group="' + group + '"]');
    cards.forEach(function(c) { c.classList.remove('selected'); });
    var selected = document.querySelector('.custom-option[data-group="' + group + '"][data-value="' + value + '"]');
    if (selected) selected.classList.add('selected');
  },

  nextStep: function() {
    var currentGroup = this.getCurrentGroup();
    if (currentGroup && !this.selections[currentGroup]) {
      alert('請先選擇一個選項再繼續');
      return;
    }
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.renderStep(this.currentStep);
      this.updateProgress();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  getCurrentGroup: function() {
    var map = { 1: 'glassColor', 2: 'metalType', 3: 'chainLength', 4: 'accessoryType' };
    return map[this.currentStep] || null;
  },

  renderStep: function(step) {
    var container = document.getElementById('step-content');
    if (!container) return;
    var html = '';
    switch (step) {
      case 1: html = this.renderStep1(); break;
      case 2: html = this.renderStep2(); break;
      case 3: html = this.renderStep3(); break;
      case 4: html = this.renderStep4(); break;
      case 5: html = this.renderStep5(); break;
    }
    container.innerHTML = html;
    // Event delegation - handle option clicks at container level
    if (!container._delegationSet) {
      container._delegationSet = true;
      container.addEventListener('click', function(e) {
        var opt = e.target.closest('.custom-option');
        if (!opt) return;
        BME_CUSTOM.selectOption(opt.dataset.group, opt.dataset.value);
      });
    }
    var nextBtn = document.getElementById('step-next-btn');
    if (nextBtn) {
      if (step < this.totalSteps) {
        nextBtn.style.display = 'inline-flex';
        nextBtn.textContent = step === 4 ? '確認送出' : '下一步';
        nextBtn.onclick = step === 4 ? function() { BME_CUSTOM.submitOrder(); } : function() { BME_CUSTOM.nextStep(); };
      } else {
        nextBtn.style.display = 'none';
      }
    }
  },

  renderStep1: function() {
    var self = this;
    var options = [
      { value: 'romantic_rose', label: '浪漫復古', desc: '玫瑰金、粉嫩色系，優雅溫柔', color: '#D4A574', emoji: '🌸' },
      { value: 'clear_pastel', label: '清透日常', desc: '透明琉璃、淺色系，清爽百搭', color: '#A8D8EA', emoji: '✨' },
      { value: 'porcelain_blue', label: '霧藍瓷感', desc: '霧面質感、藍灰色調，沉穩內斂', color: '#8FB8C9', emoji: '🍃' },
      { value: 'sage_natural', label: '自然清新', desc: '墨綠、大地色系，質樸自然', color: '#7BAE7F', emoji: '🌿' },
      { value: 'midnight_luxury', label: '午夜精品', desc: '深色系、金屬光澤，奢華低調', color: '#0A1628', emoji: '🌙' }
    ];
    var selected = this.selections.glassColor;
    return '<h3>選擇琉璃色系</h3><p class="custom-step-desc">挑選你喜歡的風格，決定整體色調</p><div class="custom-options-grid">' +
      options.map(function(o) {
        return '<div class="custom-option' + (selected === o.value ? ' selected' : '') + '" data-group="glassColor" data-value="' + o.value + '" style="border-left:4px solid ' + o.color + ';">' +
          '<div class="custom-option-emoji">' + o.emoji + '</div>' +
          '<div class="custom-option-label">' + o.label + '</div>' +
          '<div class="custom-option-desc">' + o.desc + '</div>' +
          '<span class="selected-check">&#10003;</span>' +
        '</div>';
      }).join('') + '</div>';
  },

  renderStep2: function() {
    var self = this;
    var options = [
      { value: 'rose_gold', label: '玫瑰金', desc: '品牌經典色，溫暖優雅', emoji: '💎' },
      { value: 'warm_gold', label: '暖金色', desc: '復古質感，華麗大氣', emoji: '✨' },
      { value: 'silver', label: '銀色', desc: '簡約俐落，百搭不挑色', emoji: '⭐' },
      { value: 'black', label: '黑色', desc: '個性酷感，低調帥氣', emoji: '🖤' }
    ];
    var selected = this.selections.metalType;
    return '<h3>選擇金屬配件</h3><p class="custom-step-desc">搭配你的琉璃色系，決定五金質感</p><div class="custom-options-grid">' +
      options.map(function(o) {
        return '<div class="custom-option' + (selected === o.value ? ' selected' : '') + '" data-group="metalType" data-value="' + o.value + '">' +
          '<div class="custom-option-emoji">' + o.emoji + '</div>' +
          '<div class="custom-option-label">' + o.label + '</div>' +
          '<div class="custom-option-desc">' + o.desc + '</div>' +
        '<span class="selected-check">&#10003;</span>' +
        '</div>';
      }).join('') + '</div>';
  },

  renderStep3: function() {
    var self = this;
    var options = [
      { value: 'choker', label: '短鏈 (~30cm)', desc: '頸鏈／手環長度', emoji: '📿' },
      { value: 'medium', label: '中鏈 (~45cm)', desc: '標準手機鏈／項鍊長度', emoji: '📱' },
      { value: 'long', label: '長鏈 (~60cm)', desc: '長項鍊／斜背手機鏈', emoji: '💫' },
      { value: 'custom_length', label: '客製長度', desc: '告訴我你想要的長度', emoji: '📏' }
    ];
    var selected = this.selections.chainLength;
    return '<h3>選擇長度</h3><p class="custom-step-desc">決定鏈條或掛繩的長度</p><div class="custom-options-grid">' +
      options.map(function(o) {
        return '<div class="custom-option' + (selected === o.value ? ' selected' : '') + '" data-group="chainLength" data-value="' + o.value + '">' +
          '<div class="custom-option-emoji">' + o.emoji + '</div>' +
          '<div class="custom-option-label">' + o.label + '</div>' +
          '<div class="custom-option-desc">' + o.desc + '</div>' +
        '<span class="selected-check">&#10003;</span>' +
        '</div>';
      }).join('') + '</div>';
  },

  renderStep4: function() {
    var self = this;
    var options = [
      { value: 'phone_strap', label: '手機鏈', desc: '手機掛繩／手腕鏈', emoji: '📱' },
      { value: 'earrings', label: '耳環／耳掛', desc: '琉璃耳飾', emoji: '💎' },
      { value: 'bracelet', label: '手鍊', desc: '琉璃手鍊', emoji: '📿' },
      { value: 'necklace', label: '項鍊', desc: '琉璃項鍊／墜飾', emoji: '💫' },
      { value: 'keychain', label: '鑰匙圈', desc: '包包掛飾／鑰匙圈', emoji: '🔑' },
      { value: 'other', label: '其他', desc: '其他你想要的品項', emoji: '💭' }
    ];
    var selected = this.selections.accessoryType;
    return '<h3>選擇飾品類型</h3><p class="custom-step-desc">你想做什麼樣的飾品？</p><div class="custom-options-grid">' +
      options.map(function(o) {
        return '<div class="custom-option' + (selected === o.value ? ' selected' : '') + '" data-group="accessoryType" data-value="' + o.value + '">' +
          '<div class="custom-option-emoji">' + o.emoji + '</div>' +
          '<div class="custom-option-label">' + o.label + '</div>' +
          '<div class="custom-option-desc">' + o.desc + '</div>' +
        '<span class="selected-check">&#10003;</span>' +
        '</div>';
      }).join('') + '</div>';
  },

  renderStep5: function() {
    var styleLabels = {
      romantic_rose: '浪漫復古', clear_pastel: '清透日常', porcelain_blue: '霧藍瓷感',
      sage_natural: '自然清新', midnight_luxury: '午夜精品'
    };
    var metalLabels = {
      rose_gold: '玫瑰金', warm_gold: '暖金色', silver: '銀色', black: '黑色'
    };
    var lengthLabels = {
      choker: '短鏈 (~30cm)', medium: '中鏈 (~45cm)', long: '長鏈 (~60cm)', custom_length: '客製長度'
    };
    var typeLabels = {
      phone_strap: '手機鏈', earrings: '耳環／耳掛', bracelet: '手鍊',
      necklace: '項鍊', keychain: '鑰匙圈', other: '其他'
    };

    return '<h3>確認訂製內容</h3><p class="custom-step-desc">請確認你的選擇，沒問題就可以送出了</p>' +
      '<div class="custom-summary">' +
        '<div class="custom-summary-row"><span>色系</span><strong>' + (styleLabels[this.selections.glassColor] || '—') + '</strong></div>' +
        '<div class="custom-summary-row"><span>金屬</span><strong>' + (metalLabels[this.selections.metalType] || '—') + '</strong></div>' +
        '<div class="custom-summary-row"><span>長度</span><strong>' + (lengthLabels[this.selections.chainLength] || '—') + '</strong></div>' +
        '<div class="custom-summary-row"><span>類型</span><strong>' + (typeLabels[this.selections.accessoryType] || '—') + '</strong></div>' +
      '</div>' +
      '<div class="form-group" style="margin-top:24px;">' +
        '<label class="form-label">補充描述（選填）</label>' +
        '<textarea id="custom-desc" class="form-input" rows="3" placeholder="描述你夢想中的飾品，例如想要的顏色深淺、搭配想法、參考風格……" style="resize:vertical;">' + (this.selections.description || '') + '</textarea>' +
      '</div>' +
      '<div class="custom-contact-info">' +
        '<p style="font-size:13px;color:#888;">送出後我們會透過 IG 私訊與你聯繫討論細節與報價。</p>' +
      '</div>';
  },

  submitOrder: function() {
    var self = this;
    var desc = document.getElementById('custom-desc');
    if (desc) self.selections.description = desc.value;

    BME_getUser().then(function(user) {
      if (!user) {
        if (confirm('需要登入才能送出訂製需求。前往登入頁面？')) {
          window.location.href = 'login.html?redirect=custom.html';
        }
        return;
      }
      BME_getProfile().then(function(profile) {
        var btn = document.getElementById('step-next-btn');
        btn.disabled = true;
        btn.textContent = '送出中…';

        var client = null;
        initSupabase().then(function(c) {
          client = c;
          return client.from('custom_orders').insert({
            user_id: user.id,
            customer_name: profile?.nickname || '會員',
            glass_color: self.selections.glassColor,
            metal_type: self.selections.metalType,
            chain_length: self.selections.chainLength,
            accessory_type: self.selections.accessoryType,
            description: self.selections.description || ''
          });
        }).then(function() {
          document.getElementById('step-content').innerHTML =
            '<div class="custom-success">' +
              '<div style="font-size:48px;margin-bottom:16px;">✅</div>' +
              '<h3>訂製需求已送出！</h3>' +
              '<p>我們會在 1-2 個工作天內透過 IG 私訊與你聯繫。</p>' +
              '<a href="products.html" class="btn btn-primary" style="margin-top:16px;">繼續逛逛</a>' +
            '</div>';
          document.getElementById('step-next-btn').style.display = 'none';
        }).catch(function(err) {
          btn.disabled = false;
          btn.textContent = '確認送出';
          alert('送出失敗，請稍後再試：' + (err.message || ''));
        });
      });
    });
  }
};
