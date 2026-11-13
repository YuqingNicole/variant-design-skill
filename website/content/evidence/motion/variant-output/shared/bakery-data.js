/* 半山面包 · 三个方向共用的数据与工具。内容取自项目原页面 index.html。 */
(function () {
  const breads = [
    { id: "sourdough", name: "乡村酸种", price: 38, stock: 6 },
    { id: "rye-walnut", name: "黑麦核桃", price: 42, stock: 2 },
    { id: "croissant", name: "可颂", price: 16, stock: 0 }
  ];

  const yuan = new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0
  });

  const dayFormat = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short"
  });

  function isoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function tomorrow() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    t.setDate(t.getDate() + 1);
    return t;
  }

  function formatDay(isoValue) {
    return dayFormat.format(new Date(isoValue + "T00:00:00"));
  }

  function stockLabel(stock) {
    if (stock === 0) return "已售罄";
    return "剩 " + stock + " 个";
  }

  function maskPhone(phone) {
    const p = String(phone).replace(/\D/g, "");
    return p.slice(0, 3) + "****" + p.slice(7);
  }

  function validPhone(value) {
    return /^1\d{10}$/.test(String(value).trim());
  }

  window.BAKERY = {
    name: "半山面包",
    headline: "每天早上七点出炉",
    intro: "天然酵种、本地小麦，杭州西溪路 128 号。卖完即止。",
    address: "杭州西溪路 128 号",
    hours: "周二至周日 7:00–14:00 · 周一休息",
    breads: breads,
    messages: {
      success: "已收到，我们会短信确认。",
      phoneError: "手机号需要 11 位数字，以 1 开头。",
      dateError: "取货日期最早是明天，请重新选择。",
      submitting: "提交中…",
      submitted: "已提交",
      again: "再订一份"
    },
    /* 占位延迟：真实项目里由预订请求的返回时间决定，这里只用来展示提交中状态。 */
    requestDelayMs: 500,
    yuan: yuan,
    isoDate: isoDate,
    tomorrow: tomorrow,
    formatDay: formatDay,
    stockLabel: stockLabel,
    maskPhone: maskPhone,
    validPhone: validPhone
  };
})();
