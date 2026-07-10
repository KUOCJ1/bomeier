// Bo Mei Er 客製訂製流程
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
    referenceImage: {
      name: '',
      dataUrl: ''
    }
  },
  styleCards: [
    {
      value: 'romantic_rose',
      label: '浪漫復古',
      scene: '送禮 / 約會 / 柔和穿搭',
      feel: '柔和暖調',
      image: 'images/products/BM-T007_main.jpg',
      productName: '櫻花雨',
      accent: '#D4A574',
      colorLabel: '玫瑰金、粉嫩色系'
    },
    {
      value: 'clear_pastel',
      label: '清透日常',
      scene: '通勤 / 百搭 / 透明殼',
      feel: '極簡通勤',
      image: 'images/products/BM-T001_main.jpg',
      productName: '晨光序曲',
      accent: '#A8D8EA',
      colorLabel: '透明、淺色系'
    },
    {
      value: 'porcelain_blue',
      label: '霧藍瓷感',
      scene: '冷調 / 安靜 / 質感穿搭',
      feel: '靜謐質感',
      image: 'images/products/BM-T015_main.jpg',
      productName: '海洋藍調',
      accent: '#8FB8C9',
      colorLabel: '藍灰色調、霧感珠串'
    },
    {
      value: 'sage_natural',
      label: '自然清新',
      scene: '日常 / 旅行 / 大地色',
      feel: '自然系',
      image: 'images/products/BM-T014_main.jpg',
      productName: '森林物語',
      accent: '#7BAE7F',
      colorLabel: '大地色、植物感'
    },
    {
      value: 'midnight_luxury',
      label: '午夜精品',
      scene: '夜晚 / 低調 / 金屬感',
      feel: '高級夜色',
      image: 'images/products/BM-T017_main.jpg',
      productName: '星河漫夜',
      accent: '#0A1628',
      colorLabel: '深色背景、金屬光澤'
    }
  ],

  init: function() {
    this.renderStep(this.currentStep);
    this.updateProgress();
    this.setupNavigation();
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

  getStyleCard: function(value) {
    for (var i = 0; i < this.styleCards.length; i++) {
      if (this.styleCards[i].value === value) return this.styleCards[i];
    }
    return null;
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
      if (step < this.totalSteps) {
        nextBtn.style.display = 'inline-flex';
        nextBtn.textContent = step === 4 ? '送出訂製' : '下一步 →';
        nextBtn.onclick = step === 4
          ? function() { BME_CUSTOM.submitOrder(); }
          : function() { BME_CUSTOM.nextStep(); };
      } else {
        nextBtn.style.display = 'none';
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
    return '' +
      '<div class="custom-step-intro">' +
        '<h3>先看風格，再選細節</h3>' +
        '<p class="custom-step-desc">這一步不是選顏色而已，是先看你的手機鏈會長什麼氣質。每張圖都對應一個代表風格，讓差異先被看見。</p>' +
      '</div>' +
      '<div class="custom-style-grid">' +
        this.styleCards.map(function(card) {
          var activeClass = selected === card.value ? ' selected' : '';
          return '' +
            '<button type="button" class="custom-option custom-style-option' + activeClass + '" data-group="glassColor" data-value="' + card.value + '" style="--accent:' + card.accent + ';">' +
              '<div class="custom-option-image">' +
                '<img src="' + card.image + '" alt="' + card.label + ' 代表款情境圖">' +
                '<span class="custom-style-note">' + card.feel + '</span>' +
              '</div>' +
              '<div class="custom-option-copy">' +
                '<div class="custom-option-kicker">Style Preview</div>' +
                '<div class="custom-option-label">' + card.label + '</div>' +
                '<div class="custom-option-desc">代表款：' + card.productName + '</div>' +
                '<div class="custom-option-desc">適合場景：' + card.scene + '</div>' +
                '<div class="custom-option-desc">一眼感受：' + card.colorLabel + '</div>' +
              '</div>' +
              '<span class="selected-check">&#10003;</span>' +
            '</button>';
        }).join('') +
      '</div>';
  },

  renderStep2: function() {
    var options = [
      { value: 'rose_gold', label: '玫瑰金', desc: '帶一點粉感，最能接住浪漫與溫柔風格。', emoji: '🌷' },
      { value: 'warm_gold', label: '暖金', desc: '更亮一些，會把琉璃的顏色往暖調拉。', emoji: '✨' },
      { value: 'silver', label: '銀色', desc: '乾淨、俐落，適合清透與冷調系。', emoji: '◌' },
      { value: 'black', label: '黑色', desc: '對比感強，讓整體更利落、有個性。', emoji: '⬛' }
    ];
    var selected = this.selections.metalType;
    return '<h3>選擇金屬配件</h3><p class="custom-step-desc">搭配你的琉璃色系，決定五金質感。</p><div class="custom-options-grid">' +
      options.map(function(o) {
        return '<div class="custom-option' + (selected === o.value ? ' selected' : '') + '" data-group="metalType" data-value="' + o.value + '">' +
          '<div class="custom-option-emoji">' + o.emoji + '</div>' +
          '<div>' +
            '<div class="custom-option-label">' + o.label + '</div>' +
            '<div class="custom-option-desc">' + o.desc + '</div>' +
          '</div>' +
          '<span class="selected-check">&#10003;</span>' +
        '</div>';
      }).join('') + '</div>';
  },

  renderStep3: function() {
    var options = [
      { value: 'choker', label: '短鏈 (~30cm)', desc: '靠近頸部，精緻感最明顯。', emoji: '📎' },
      { value: 'medium', label: '中鏈 (~45cm)', desc: '最通用的長度，日常最不容易出錯。', emoji: '📏' },
      { value: 'long', label: '長鏈 (~60cm)', desc: '垂墜感更強，視覺份量更足。', emoji: '〰️' },
      { value: 'custom_length', label: '客製長度', desc: '如果你有明確尺寸，我們照你的需求做。', emoji: '✎' }
    ];
    var selected = this.selections.chainLength;
    return '<h3>選擇長度</h3><p class="custom-step-desc">決定鏈條或掛繩的長度。</p><div class="custom-options-grid">' +
      options.map(function(o) {
        return '<div class="custom-option' + (selected === o.value ? ' selected' : '') + '" data-group="chainLength" data-value="' + o.value + '">' +
          '<div class="custom-option-emoji">' + o.emoji + '</div>' +
          '<div>' +
            '<div class="custom-option-label">' + o.label + '</div>' +
            '<div class="custom-option-desc">' + o.desc + '</div>' +
          '</div>' +
          '<span class="selected-check">&#10003;</span>' +
        '</div>';
      }).join('') + '</div>';
  },

  renderStep4: function() {
    var options = [
      { value: 'phone_strap', label: '手機掛繩', desc: '最直覺的使用方式。', emoji: '📱' },
      { value: 'earrings', label: '耳飾', desc: '小巧、輕盈、好搭。', emoji: '👂' },
      { value: 'bracelet', label: '手鍊', desc: '戴在手上也會有存在感。', emoji: '🖐' },
      { value: 'necklace', label: '項鍊', desc: '想把琉璃放到更靠近臉的位置。', emoji: '⛓' },
      { value: 'keychain', label: '鑰匙圈', desc: '最實用的隨身小物。', emoji: '🔑' },
      { value: 'other', label: '其他', desc: '有自己的想法，也可以直接寫。', emoji: '✦' }
    ];
    var selected = this.selections.accessoryType;
    return '<h3>選擇飾品類型</h3><p class="custom-step-desc">你想做成什麼樣的用途？</p><div class="custom-options-grid">' +
      options.map(function(o) {
        return '<div class="custom-option' + (selected === o.value ? ' selected' : '') + '" data-group="accessoryType" data-value="' + o.value + '">' +
          '<div class="custom-option-emoji">' + o.emoji + '</div>' +
          '<div>' +
            '<div class="custom-option-label">' + o.label + '</div>' +
            '<div class="custom-option-desc">' + o.desc + '</div>' +
          '</div>' +
          '<span class="selected-check">&#10003;</span>' +
        '</div>';
      }).join('') + '</div>';
  },

  renderStep5: function() {
    var styleLabels = {
      romantic_rose: '浪漫復古',
      clear_pastel: '清透日常',
      porcelain_blue: '霧藍瓷感',
      sage_natural: '自然清新',
      midnight_luxury: '午夜精品'
    };
    var metalLabels = {
      rose_gold: '玫瑰金',
      warm_gold: '暖金',
      silver: '銀色',
      black: '黑色'
    };
    var lengthLabels = {
      choker: '短鏈 (~30cm)',
      medium: '中鏈 (~45cm)',
      long: '長鏈 (~60cm)',
      custom_length: '客製長度'
    };
    var typeLabels = {
      phone_strap: '手機掛繩',
      earrings: '耳飾',
      bracelet: '手鍊',
      necklace: '項鍊',
      keychain: '鑰匙圈',
      other: '其他'
    };
    var selectedStyle = this.getStyleCard(this.selections.glassColor);
    var referenceImage = this.selections.referenceImage || { name: '', dataUrl: '' };

    return '<h3>確認訂製內容</h3><p class="custom-step-desc">如果沒問題，就把需求送出。我們會依照你選的風格開始整理。</p>' +
      (selectedStyle ? '<div class="custom-summary-preview"><img src="' + selectedStyle.image + '" alt="' + selectedStyle.label + ' 代表款"><div><div class="custom-summary-preview-kicker">你選的風格</div><strong>' + selectedStyle.label + '</strong><p>代表款：' + selectedStyle.productName + '</p><p>' + selectedStyle.colorLabel + '，適合場景：' + selectedStyle.scene + '</p></div></div>' : '') +
      '<div class="custom-summary">' +
        '<div class="custom-summary-row"><span>色系</span><strong>' + (styleLabels[this.selections.glassColor] || '—') + '</strong></div>' +
        '<div class="custom-summary-row"><span>金屬</span><strong>' + (metalLabels[this.selections.metalType] || '—') + '</strong></div>' +
        '<div class="custom-summary-row"><span>長度</span><strong>' + (lengthLabels[this.selections.chainLength] || '—') + '</strong></div>' +
        '<div class="custom-summary-row"><span>類型</span><strong>' + (typeLabels[this.selections.accessoryType] || '—') + '</strong></div>' +
      '</div>' +
      '<div class="custom-reference-upload">' +
        '<div class="custom-reference-upload-head">' +
          '<div>' +
            '<label class="form-label" for="custom-reference-image">參考圖／上傳範例</label>' +
            '<p class="custom-helper-text">先選風格，再補一張你喜歡的圖片或現有範例，我們會更快抓到方向。限 3MB 內的圖片檔。</p>' +
          '</div>' +
          '<label class="btn btn-secondary custom-upload-btn" for="custom-reference-image">選擇圖片</label>' +
        '</div>' +
        '<input id="custom-reference-image" type="file" accept="image/*" class="custom-file-input" />' +
        '<div class="custom-reference-preview' + (referenceImage.dataUrl ? ' has-image' : '') + '" id="reference-image-preview">' +
          (referenceImage.dataUrl
            ? '<img src="' + referenceImage.dataUrl + '" alt="參考圖預覽"><div class="custom-reference-preview-copy"><strong>' + referenceImage.name + '</strong><p>這張圖會跟你的需求一起記錄。</p></div><button type="button" class="custom-reference-clear" id="reference-image-clear">移除</button>'
            : '<div class="custom-reference-empty">目前還沒有上傳參考圖。你可以放風格照、手機殼照，或一張你喜歡的配色範例。</div>'
          ) +
        '</div>' +
      '</div>' +
      '<div class="form-group" style="margin-top:24px;">' +
        '<label class="form-label">補充描述</label>' +
        '<textarea id="custom-desc" class="form-input" rows="3" placeholder="例如：想要更淡一點、偏金色一點、希望像送禮款、可接受的長度範圍……" style="resize:vertical;">' + (this.selections.description || '') + '</textarea>' +
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
              '<h3>訂製需求已送出</h3>' +
              '<p>我們會在 1-2 個工作天內透過 IG 私訊你，確認細節。</p>' +
              '<a href="products.html" class="btn btn-primary" style="margin-top:16px;">繼續逛商品</a>' +
            '</div>';
          var nextBtn = document.getElementById('step-next-btn');
          if (nextBtn) nextBtn.style.display = 'none';
        }).catch(function(err) {
          if (btn) {
            btn.disabled = false;
            btn.textContent = '送出訂製';
          }
          alert('送出失敗：' + (err && err.message ? err.message : '請稍後再試。'));
        });
      });
    });
  }
};
