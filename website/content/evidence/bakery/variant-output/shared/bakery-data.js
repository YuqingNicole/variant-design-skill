/* 半山面包 · 三个方向共用的数据与表单行为（经典脚本，file:// 下可直接打开） */
(function (global) {
  'use strict';

  var data = {
    brand: '半山面包',
    headline: '每天早上七点出炉',
    intro: '天然酵种、本地小麦，杭州西溪路 128 号。卖完即止。',
    story: [
      '酵种是 2019 年开店那天起的，每天喂两次，到现在没断过。面粉来自建德的一家小磨坊，石磨慢磨，麸皮留得多，所以面包颜色偏深，咬下去有麦子本身的甜。',
      '我们不做预制，也不追加二炉。七点出炉的就是当天的全部，卖完就关门整理，准备第二天的面团。'
    ],
    address: '杭州西溪路 128 号',
    hoursLine: '周二至周日 7:00–14:00 · 周一休息',
    week: [
      { day: '周一', open: '' },
      { day: '周二', open: '7:00–14:00' },
      { day: '周三', open: '7:00–14:00' },
      { day: '周四', open: '7:00–14:00' },
      { day: '周五', open: '7:00–14:00' },
      { day: '周六', open: '7:00–14:00' },
      { day: '周日', open: '7:00–14:00' }
    ],
    stockUpdatedAt: '7:40',
    breads: [
      { id: 'sourdough', name: '乡村酸种', price: 38, stock: 6, desc: '天然酵种发酵 24 小时，外壳厚脆，内里湿润带酸香。' },
      { id: 'rye', name: '黑麦核桃', price: 42, stock: 2, desc: '六成黑麦配整粒核桃，切片回烤后最香。' },
      { id: 'croissant', name: '可颂', price: 16, stock: 0, desc: '法国黄油，二十七层，当天最早卖完的一款。' }
    ],
    maxPerBread: 3,
    confirmNote: '已收到，我们会短信确认。'
  };

  var yuan = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0 });
  var dateFmt = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
  var longDateFmt = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  function pad(n) { return String(n).padStart(2, '0'); }
  function toISODate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseISODate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  function startOfToday() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function tomorrow() { var d = startOfToday(); d.setDate(d.getDate() + 1); return d; }
  function lastBookableDay() { var d = tomorrow(); d.setDate(d.getDate() + 13); return d; }
  function stockLabel(n) { return n > 0 ? '剩 ' + n + ' 个' : '已售罄'; }
  function formatPrice(n) { return yuan.format(n); }

  function validatePhone(value) {
    var v = (value || '').replace(/\s+/g, '');
    if (!v) return '请填手机号，确认短信会发到这个号码。';
    if (!/^1\d{10}$/.test(v)) return '手机号需要 11 位数字，并以 1 开头。';
    return '';
  }

  function validateDate(value) {
    if (!value) return '请选一个取货日期。';
    var d = parseISODate(value);
    if (!d) return '日期没有识别出来，请用日期选择器重新选。';
    var t = tomorrow();
    if (d < t) return '最早可预订明天（' + dateFmt.format(t) + '）。';
    if (d.getDay() === 1) return '周一休息，请选周二到周日。';
    if (d > lastBookableDay()) return '最多提前两周预订，请选 ' + dateFmt.format(lastBookableDay()) + ' 之前的日期。';
    return '';
  }

  /* 渲染面包列表：template(bread) 返回 HTML 字符串，由各方向自行定义样式结构 */
  function renderBreads(container, template) {
    if (!container) return;
    container.innerHTML = data.breads.map(template).join('');
  }

  /* 数量选择（仅在把面包选择并入表单的方向中使用） */
  function setupQuantityPickers(root, onChange) {
    if (!root) return;
    root.querySelectorAll('[data-qty]').forEach(function (row) {
      var input = row.querySelector('input[type="number"]');
      var minus = row.querySelector('[data-step="-1"]');
      var plus = row.querySelector('[data-step="1"]');
      function set(n) {
        n = Math.max(0, Math.min(data.maxPerBread, n || 0));
        input.value = String(n);
        minus.disabled = n === 0;
        plus.disabled = n === data.maxPerBread;
        row.classList.toggle('is-chosen', n > 0);
        if (onChange) onChange();
      }
      minus.addEventListener('click', function () { set(Number(input.value) - 1); });
      plus.addEventListener('click', function () { set(Number(input.value) + 1); });
      input.addEventListener('change', function () { set(Number(input.value)); });
      set(Number(input.value));
    });
  }

  function chosenItems(root) {
    if (!root) return [];
    var items = [];
    root.querySelectorAll('[data-qty]').forEach(function (row) {
      var n = Number(row.querySelector('input[type="number"]').value);
      if (n > 0) {
        var bread = data.breads.filter(function (b) { return b.id === row.getAttribute('data-qty'); })[0];
        if (bread) items.push({ bread: bread, qty: n });
      }
    });
    return items;
  }

  function summarize(items) {
    if (!items.length) return { text: '', total: 0 };
    var total = items.reduce(function (s, it) { return s + it.bread.price * it.qty; }, 0);
    var text = items.map(function (it) { return it.bread.name + ' × ' + it.qty; }).join('，');
    return { text: text, total: total };
  }

  /* 预订表单：校验、提交中、成功、重置。options.items() 可选，返回已选面包 */
  function setupOrderForm(form, options) {
    if (!form) return;
    options = options || {};
    var phone = form.querySelector('input[name="phone"]');
    var date = form.querySelector('input[name="date"]');
    var submit = form.querySelector('button[type="submit"]');
    var status = form.querySelector('[data-status]');
    var success = form.parentElement.querySelector('[data-success]');
    var again = success ? success.querySelector('[data-again]') : null;
    var submitLabel = submit.textContent;
    var timer = null;

    date.min = toISODate(tomorrow());
    date.max = toISODate(lastBookableDay());

    function errorEl(input) { return form.querySelector('[data-error-for="' + input.name + '"]'); }
    function setError(input, message) {
      var el = errorEl(input);
      if (el) el.textContent = message;
      if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }

    phone.addEventListener('blur', function () { if (phone.value) setError(phone, validatePhone(phone.value)); });
    date.addEventListener('change', function () { setError(date, validateDate(date.value)); });
    phone.addEventListener('input', function () { if (phone.getAttribute('aria-invalid')) setError(phone, validatePhone(phone.value)); });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var problems = [];
      var phoneMsg = validatePhone(phone.value);
      var dateMsg = validateDate(date.value);
      setError(phone, phoneMsg); if (phoneMsg) problems.push(phone);
      setError(date, dateMsg); if (dateMsg) problems.push(date);
      var items = options.items ? options.items() : null;
      if (items && !items.length) {
        var itemsError = form.querySelector('[data-error-for="items"]');
        if (itemsError) itemsError.textContent = '请至少选一款面包。';
        problems.unshift(form.querySelector('[data-qty] button:not(:disabled)') || phone);
      } else {
        var cleared = form.querySelector('[data-error-for="items"]');
        if (cleared) cleared.textContent = '';
      }
      if (problems.length) {
        if (status) status.textContent = '还有 ' + problems.length + ' 处需要补充。';
        problems[0].focus();
        return;
      }
      if (status) status.textContent = '';
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      submit.textContent = '提交中…';
      var pickedDate = parseISODate(date.value);
      var cleanPhone = phone.value.replace(/\s+/g, '');
      clearTimeout(timer);
      timer = setTimeout(function () {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        submit.textContent = submitLabel;
        var lines = [];
        lines.push(longDateFmt.format(pickedDate) + ' 取货。');
        if (items && items.length) {
          var s = summarize(items);
          lines.push(s.text + '，共 ' + formatPrice(s.total) + '，到店付款。');
        }
        lines.push('确认短信会发到 ' + cleanPhone.slice(0, 3) + '****' + cleanPhone.slice(7) + '。');
        if (success) {
          var detail = success.querySelector('[data-success-detail]');
          if (detail) detail.textContent = lines.join('');
          form.hidden = true;
          success.hidden = false;
          var heading = success.querySelector('h3, h2, p');
          if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus(); }
        }
      }, 600);
    });

    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        form.querySelectorAll('[data-error-for]').forEach(function (el) { el.textContent = ''; });
        form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
        if (options.reset) options.reset();
        success.hidden = true;
        form.hidden = false;
        phone.focus();
      });
    }
  }

  /* 可选：把 min 日期写进说明文字，例如“最早明天（11月14日 周六）” */
  function describeEarliest() { return dateFmt.format(tomorrow()); }
  function todayLabel() { return longDateFmt.format(startOfToday()); }

  global.BANSHAN = {
    data: data,
    formatPrice: formatPrice,
    stockLabel: stockLabel,
    renderBreads: renderBreads,
    setupQuantityPickers: setupQuantityPickers,
    chosenItems: chosenItems,
    summarize: summarize,
    setupOrderForm: setupOrderForm,
    describeEarliest: describeEarliest,
    todayLabel: todayLabel,
    validatePhone: validatePhone,
    validateDate: validateDate
  };
})(window);
