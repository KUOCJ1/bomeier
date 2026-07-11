// Bo Mei Er 客製訂製流程
// 依賴：auth.js, supabase-config.js

var BME_CUSTOM = {
  currentStep: 1,
  totalSteps: 5,
  config: null,
  selections: {
    glassColor: '',
    metalType: '',
    chainLength: '',
    accessoryType: '',
    description: '',
    referenceImage: {
      name: '',
      dataUrl: ''
    }
  },

  defaultConfig: {
    settings: {
      heroTitle: '打造你的夢想飾品',
      heroSubtitle: '選風格、選材質、補需求，我們把你的想法整理成可以配戴的日常小物。',
      referenceHelp: '上傳風格照、手機殼照，或一張你喜歡的配色範例。',
      descriptionPlaceholder: '例如：想要更淡一點、偏金色一點、希望像送禮款、可接受的長度範圍……',
      submitLabel: '送出客製想法',
      successTitle: '客製想法已送出',
      successBody: '我們會在 1-2 個工作天內透過 IG 私訊你，確認細節。'
    },
    options: {
      style: [
        { value: 'romantic_rose', label: '浪漫復古', desc: '玫瑰金與粉色珠串，偏送禮與約會感。', scene: '送禮 / 約會 / 柔和穿搭', wear: '奶茶色、白色、針織、洋裝', feel: '柔和暖調', image: 'images/products/BM-T007_main.jpg', productName: '櫻花雨', accent: '#D4A574', colorLabel: '玫瑰金、粉嫩色系' },
        { value: 'clear_pastel', label: '清透日常', desc: '透明感高、日常通勤最安全。', scene: '通勤 / 百搭 / 透明殼', wear: '白襯衫、牛仔、淺色休閒穿搭', feel: '極簡通勤', image: 'images/products/BM-T001_main.jpg', productName: '晨光序曲', accent: '#A8D8EA', colorLabel: '透明、淺色系' },
        { value: 'porcelain_blue', label: '霧藍瓷感', desc: '藍灰調與冷感質地，安靜耐看。', scene: '冷調 / 安靜 / 質感穿搭', wear: '灰藍、黑白、銀色配件', feel: '靜謐質感', image: 'images/products/BM-T015_main.jpg', productName: '海洋藍調', accent: '#8FB8C9', colorLabel: '藍灰色調、霧感珠串' },
        { value: 'sage_natural', label: '自然清新', desc: '大地色與植物感，放鬆好搭配。', scene: '日常 / 旅行 / 大地色', wear: '亞麻、卡其、米白、棉麻穿搭', feel: '自然系', image: 'images/products/BM-T014_main.jpg', productName: '森林物語', accent: '#7BAE7F', colorLabel: '大地色、植物感' },
        { value: 'midnight_luxury', label: '午夜精品', desc: '深色與金屬光澤，低調但有份量。', scene: '夜晚 / 低調 / 金屬感', wear: '黑色、深藍、金屬飾品、俐落穿搭', feel: '高級夜色', image: 'images/products/BM-T017_main.jpg', productName: '星河漫夜', accent: '#0A1628', colorLabel: '深色背景、金屬光澤' }
      ],
      metal: [
        { value: 'rose_gold', label: '玫瑰金', desc: '帶一點粉感，最能接住浪漫與溫柔風格。', emoji: '◇' },
        { value: 'warm_gold', label: '暖金', desc: '更亮一些，會把琉璃的顏色往暖調拉。', emoji: '✦' },
        { value: 'silver', label: '銀色', desc: '乾淨、俐落，適合清透與冷調系。', emoji: '○' },
        { value: 'black', label: '黑色', desc: '對比感強，讓整體更利落、有個性。', emoji: '■' }
      ],
      length: [
        { value: 'choker', label: '短鏈 (~30cm)', desc: '靠近頸部，精緻感最明顯。', emoji: '30' },
        { value: 'medium', label: '中鏈 (~45cm)', desc: '最通用的長度，日常最不容易出錯。', emoji: '45' },
        { value: 'long', label: '長鏈 (~60cm)', desc: '垂墜感更強，視覺份量更足。', emoji: '60' },
        { value: 'custom_length', label: '客製長度', desc: '如果你有明確尺寸，我們照你的需求做。', emoji: 'cm' }
      ],
      type: [
        { value: 'phone_strap', label: '手機掛繩', desc: '最直覺的使用方式。', emoji: '手機' },
        { value: 'earrings', label: '耳飾', desc: '小巧、輕盈、好搭。', emoji: '耳' },
        { value: 'bracelet', label: '手鍊', desc: '戴在手上也會有存在感。', emoji: '手' },
        { value: 'necklace', label: '項鍊', desc: '想把琉璃放到更靠近臉的位置。', emoji: '鏈' },
        { value: 'keychain', label: '鑰匙圈', desc: '最實用的隨身小物。', emoji: '鑰' },
        { value: 'other', label: '其他', desc: '有自己的想法，也可以直接寫。', emoji: '+' }
      ]
    }
  },

  init: async function() {
    await this.loadCustomConfig();
    this.applyPageSettings();
    this.renderStep(this.currentStep);
    this.updateProgress();
    this.setupNavigation();
  },

  loadCustomConfig: async function() {
    this.config = JSON.parse(JSON.stringify(this.defaultConfig));
    try {
      if (typeof initSupabase !== 'function') return;
      var client = await initSupabase();
      if (!client) return;

      var optionsRes = await client
        .from('custom_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (optionsRes.data && optionsRes.data.length) {
        var normalized = this.normalizeOptions(optionsRes.data);
        this.config.options = Object.assign({}, this.config.options, normalized);
      }

      var settingsRes = await client
        .from('custom_page_settings')
        .select('value')
        .eq('key', 'custom_page')
        .single();
      if (settingsRes.data && settingsRes.data.value) {
        this.config.settings = Object.assign({}, this.config.settings, settingsRes.data.value);
      }
    } catch (e) {
      console.warn('Custom config fallback active:', e);
    }
  },

  normalizeOptions: function(rows) {
    var grouped = { style: [], metal: [], length: [], type: [] };
    rows.forEach(function(row) {
      var metadata = row.metadata || {};
      if (!grouped[row.option_group]) return;
      grouped[row.option_group].push({
        value: row.code,
        label: row.label,
        desc: row.description || metadata.description || '',
        image: row.image_url || metadata.image || '',
        scene: metadata.scene || '',
        wear: metadata.wear || '',
        feel: metadata.feel || '',
        productName: metadata.productName || '',
        accent: metadata.accent || '#C9956B',
        colorLabel: metadata.colorLabel || '',
        emoji: metadata.emoji || ''
      });
    });
    return grouped;
  },

  applyPageSettings: function() {
    var settings = this.config.settings;
    var title = document.getElementById('custom-page-title');
    var subtitle = document.getElementById('custom-page-subtitle');
    if (title) title.textContent = settings.heroTitle || this.defaultConfig.settings.heroTitle;
    if (subtitle) subtitle.textContent = settings.heroSubtitle || this.defaultConfig.settings.heroSubtitle;
  },

  setupNavigation: function() {
    var self = this;
    var prevBtn = document.getElementById('custom-prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        if (self.currentStep > 1) {
          self.currentStep--;
          self.renderStep(self.currentStep);
          self.updateProgress();
        }
      });
    }
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
      alert('請先選一個選項再往下。');
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

  getOptionByValue: function(group, value) {
    var list = this.config.options[group] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].value === value) return list[i];
    }
    return null;
  },

  escapeHtml: function(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  renderStep: function(step) {
    var container = document.getElementById('step-content');
    if (!container) return;

    var html = '';
    switch (step) {
      case 1: html = this.renderStep1(); break;
      case 2: html = this.renderOptionStep('metalType', 'metal', '選擇金屬配件', '搭配你的琉璃色系，決定五金質感。'); break;
      case 3: html = this.renderOptionStep('chainLength', 'length', '選擇長度', '決定鏈條或掛繩的長度。'); break;
      case 4: html = this.renderOptionStep('accessoryType', 'type', '選擇飾品類型', '你想做成什麼樣的用途？'); break;
      case 5: html = this.renderStep5(); break;
    }

    container.innerHTML = html;

    if (!container._delegationSet) {
      container._delegationSet = true;
      container.addEventListener('click', function(e) {
        var opt = e.target.closest('.custom-option');
        if (!opt) return;
        BME_CUSTOM.selectOption(opt.dataset.group, opt.dataset.value);
      });
    }

    if (step === 5) {
      this.setupReferenceImageInput();
    }

    var nextBtn = document.getElementById('step-next-btn');
    if (nextBtn) {
      nextBtn.style.display = 'inline-flex';
      if (step < this.totalSteps) {
        nextBtn.textContent = '下一步 →';
        nextBtn.onclick = function() { BME_CUSTOM.nextStep(); };
      } else {
        nextBtn.textContent = this.config.settings.submitLabel || '送出客製想法';
        nextBtn.onclick = function() { BME_CUSTOM.submitOrder(); };
      }
    }
  },

  setupReferenceImageInput: function() {
    var self = this;
    var input = document.getElementById('custom-reference-image');
    if (input && !input._bmeBound) {
      input._bmeBound = true;
      input.addEventListener('change', function(event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;

        if (!file.type || file.type.indexOf('image/') !== 0) {
          alert('請選擇圖片檔。');
          input.value = '';
          return;
        }

        if (file.size > 3 * 1024 * 1024) {
          alert('參考圖請控制在 3MB 以內。');
          input.value = '';
          return;
        }

        var reader = new FileReader();
        reader.onload = function() {
          self.selections.referenceImage = {
            name: file.name,
            dataUrl: reader.result
          };
          self.renderStep(self.currentStep);
          self.updateProgress();
        };
        reader.readAsDataURL(file);
      });
    }

    var clearBtn = document.getElementById('reference-image-clear');
    if (clearBtn && !clearBtn._bmeBound) {
      clearBtn._bmeBound = true;
      clearBtn.addEventListener('click', function() {
        self.selections.referenceImage = {
          name: '',
          dataUrl: ''
        };
        self.renderStep(self.currentStep);
        self.updateProgress();
      });
    }
  },

  renderStep1: function() {
    var selected = this.selections.glassColor;
    var cards = this.config.options.style || [];
    var self = this;
    return '' +
      '<div class="custom-step-intro">' +
        '<h3>先看風格，再選細節</h3>' +
        '<p class="custom-step-desc">這一步不是選顏色而已，是先看你的手機鏈會長什麼氣質。每張圖都對應一個代表風格，讓差異先被看見。</p>' +
      '</div>' +
      '<div class="custom-style-grid">' +
        cards.map(function(card) {
          var activeClass = selected === card.value ? ' selected' : '';
          return '' +
            '<button type="button" class="custom-option custom-style-option' + activeClass + '" data-group="glassColor" data-value="' + self.escapeHtml(card.value) + '" style="--accent:' + self.escapeHtml(card.accent || '#C9956B') + ';">' +
              '<div class="custom-option-image">' +
                (card.image ? '<img src="' + self.escapeHtml(card.image) + '" alt="' + self.escapeHtml(card.label) + ' 代表款情境圖">' : '<div class="custom-option-image-placeholder"></div>') +
                '<span class="custom-style-note">' + self.escapeHtml(card.feel || 'Style') + '</span>' +
              '</div>' +
              '<div class="custom-option-copy">' +
                '<div class="custom-option-kicker">Style Preview</div>' +
                '<div class="custom-option-label">' + self.escapeHtml(card.label) + '</div>' +
                (card.productName ? '<div class="custom-option-desc">代表款：' + self.escapeHtml(card.productName) + '</div>' : '') +
                (card.scene ? '<div class="custom-option-desc">適合場景：' + self.escapeHtml(card.scene) + '</div>' : '') +
                (card.wear ? '<div class="custom-option-desc">適合穿搭：' + self.escapeHtml(card.wear) + '</div>' : '') +
                (card.colorLabel ? '<div class="custom-option-desc">一眼感受：' + self.escapeHtml(card.colorLabel) + '</div>' : '') +
              '</div>' +
              '<span class="selected-check">&#10003;</span>' +
            '</button>';
        }).join('') +
      '</div>';
  },

  renderOptionStep: function(selectionKey, optionGroup, title, description) {
    var options = this.config.options[optionGroup] || [];
    var selected = this.selections[selectionKey];
    var self = this;
    return '<h3>' + this.escapeHtml(title) + '</h3><p class="custom-step-desc">' + this.escapeHtml(description) + '</p><div class="custom-options-grid">' +
      options.map(function(o) {
        return '<div class="custom-option' + (selected === o.value ? ' selected' : '') + '" data-group="' + self.escapeHtml(selectionKey) + '" data-value="' + self.escapeHtml(o.value) + '">' +
          '<div class="custom-option-emoji">' + self.escapeHtml(o.emoji || '✦') + '</div>' +
          '<div>' +
            '<div class="custom-option-label">' + self.escapeHtml(o.label) + '</div>' +
            '<div class="custom-option-desc">' + self.escapeHtml(o.desc) + '</div>' +
          '</div>' +
          '<span class="selected-check">&#10003;</span>' +
        '</div>';
      }).join('') + '</div>';
  },

  renderStep5: function() {
    var settings = this.config.settings;
    var selectedStyle = this.getOptionByValue('style', this.selections.glassColor);
    var referenceImage = this.selections.referenceImage || { name: '', dataUrl: '' };
    var metal = this.getOptionByValue('metal', this.selections.metalType);
    var length = this.getOptionByValue('length', this.selections.chainLength);
    var type = this.getOptionByValue('type', this.selections.accessoryType);

    return '<h3>確認訂製內容</h3><p class="custom-step-desc">如果沒問題，就把需求送出。我們會依照你選的風格開始整理。</p>' +
      (selectedStyle ? '<div class="custom-summary-preview">' +
        (selectedStyle.image ? '<img src="' + this.escapeHtml(selectedStyle.image) + '" alt="' + this.escapeHtml(selectedStyle.label) + ' 代表款">' : '') +
        '<div><div class="custom-summary-preview-kicker">你選的風格</div><strong>' + this.escapeHtml(selectedStyle.label) + '</strong><p>' + this.escapeHtml(selectedStyle.desc || '') + '</p><p>' + this.escapeHtml(selectedStyle.scene || '') + '</p></div></div>' : '') +
      '<div class="custom-summary">' +
        '<div class="custom-summary-row"><span>色系</span><strong>' + this.escapeHtml(selectedStyle ? selectedStyle.label : '—') + '</strong></div>' +
        '<div class="custom-summary-row"><span>金屬</span><strong>' + this.escapeHtml(metal ? metal.label : '—') + '</strong></div>' +
        '<div class="custom-summary-row"><span>長度</span><strong>' + this.escapeHtml(length ? length.label : '—') + '</strong></div>' +
        '<div class="custom-summary-row"><span>類型</span><strong>' + this.escapeHtml(type ? type.label : '—') + '</strong></div>' +
      '</div>' +
      '<div class="custom-reference-upload">' +
        '<div class="custom-reference-upload-head">' +
          '<div>' +
            '<label class="form-label" for="custom-reference-image">參考圖／上傳範例</label>' +
            '<p class="custom-helper-text">' + this.escapeHtml(settings.referenceHelp) + '</p>' +
          '</div>' +
          '<label class="btn btn-secondary custom-upload-btn" for="custom-reference-image">選擇圖片</label>' +
        '</div>' +
        '<input id="custom-reference-image" type="file" accept="image/*" class="custom-file-input" />' +
        '<div class="custom-reference-preview' + (referenceImage.dataUrl ? ' has-image' : '') + '" id="reference-image-preview">' +
          (referenceImage.dataUrl
            ? '<img src="' + referenceImage.dataUrl + '" alt="參考圖預覽"><div class="custom-reference-preview-copy"><strong>' + this.escapeHtml(referenceImage.name) + '</strong><p>這張圖會跟你的需求一起記錄。</p></div><button type="button" class="custom-reference-clear" id="reference-image-clear">移除</button>'
            : '<div class="custom-reference-empty">目前還沒有上傳參考圖。你可以放風格照、手機殼照，或一張你喜歡的配色範例。</div>'
          ) +
        '</div>' +
      '</div>' +
      '<div class="form-group" style="margin-top:24px;">' +
        '<label class="form-label">補充描述</label>' +
        '<textarea id="custom-desc" class="form-input" rows="3" placeholder="' + this.escapeHtml(settings.descriptionPlaceholder) + '" style="resize:vertical;">' + this.escapeHtml(this.selections.description || '') + '</textarea>' +
      '</div>' +
      '<div class="custom-contact-info">' +
        '<p style="font-size:13px;color:#888;">送出後會引導你到 Instagram 私訊，方便我們把風格細節接上。</p>' +
      '</div>';
  },

  submitOrder: function() {
    var self = this;
    var desc = document.getElementById('custom-desc');
    if (desc) self.selections.description = desc.value;

    BME_getUser().then(function(user) {
      if (!user) {
        if (confirm('你目前尚未登入，送出訂製需求前要先登入嗎？')) {
          window.location.href = 'login.html?redirect=custom.html';
        }
        return;
      }

      BME_getProfile().then(function(profile) {
        var btn = document.getElementById('step-next-btn');
        if (btn) {
          btn.disabled = true;
          btn.textContent = '送出中…';
        }

        initSupabase().then(function(client) {
          return client.from('custom_orders').insert({
            user_id: user.id,
            customer_name: (profile && profile.nickname) ? profile.nickname : '會員',
            glass_color: self.selections.glassColor,
            metal_type: self.selections.metalType,
            chain_length: self.selections.chainLength,
            accessory_type: self.selections.accessoryType,
            description: self.selections.description || '',
            reference_image_url: (self.selections.referenceImage && self.selections.referenceImage.dataUrl) ? self.selections.referenceImage.dataUrl : ''
          });
        }).then(function() {
          document.getElementById('step-content').innerHTML =
            '<div class="custom-success">' +
              '<div style="font-size:48px;margin-bottom:16px;">✓</div>' +
              '<h3>' + self.escapeHtml(self.config.settings.successTitle) + '</h3>' +
              '<p>' + self.escapeHtml(self.config.settings.successBody) + '</p>' +
              '<a href="products.html" class="btn btn-primary" style="margin-top:16px;">繼續逛商品</a>' +
            '</div>';
          var nextBtn = document.getElementById('step-next-btn');
          if (nextBtn) nextBtn.style.display = 'none';
        }).catch(function(err) {
          if (btn) {
            btn.disabled = false;
            btn.textContent = self.config.settings.submitLabel || '送出客製想法';
          }
          alert('送出失敗：' + (err && err.message ? err.message : '請稍後再試。'));
        });
      });
    });
  }
};
