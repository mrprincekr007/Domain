/* ============================================================
   SUBMANGA ADMIN - Canvas Chart Engine
   Line · Bar · Donut · Sparkline — no external libraries
   ============================================================ */

const AdminCharts = (() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  /* zero-width canvas (CSS/layout not ready) -> retry a few times */
  function needRetry(canvas, data, opts, fn) {
    var w = 0;
    try { w = canvas.getBoundingClientRect().width; } catch (e) { w = 0; }
    if (w >= 50) return false;
    var tries = (opts && opts._tries) || 0;
    if (tries < 12) {
      opts._tries = tries + 1;
      setTimeout(function () { fn(canvas, data, opts); }, 300);
    }
    return true;
  }

  function drawEmpty(canvas, msg) {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var W = Math.max(1, rect.width);
    var H = 160;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = 'rgba(140,160,210,0.55)';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(msg || 'No data yet', W / 2, H / 2);
  }
  function withAlpha(color, alpha) {
    var c = String(color || '#38bdf8').trim();
    var m = /^#([0-9a-f]{6})$/i.exec(c);
    if (m) {
      var n = parseInt(m[1], 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
    }
    if (c.indexOf('rgba(') === 0) return c;
    if (c.indexOf('rgb(') === 0) return c.replace('rgb(', 'rgba(').replace(')', ',' + alpha + ')');
    return c;
  }

  /* ---------- LINE CHART ---------- */
  function drawLineChart(canvas, data, opts) {
    opts = opts || {};
    if (needRetry(canvas, data, opts, drawLineChart)) return;
    if (!data || !data.values || !data.values.length) { drawEmpty(canvas, 'No data yet'); return; }
    const color = opts.color || '#38bdf8';
    const fillColor = opts.fillColor || 'rgba(56,189,248,0.15)';
    const lineW = opts.lineWidth || 2.5;
    const padding = { top: 20, right: 16, bottom: 32, left: 40 };
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = (opts.height || 200) * dpr;
    canvas.style.height = (opts.height || 200) + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = opts.height || 200;
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    const values = data.values || [];
    const labels = data.labels || [];
    const max = Math.max.apply(null, values) || 1;
    const min = 0;
    const range = max - min || 1;
    const step = values.length > 1 ? chartW / (values.length - 1) : chartW / 2;

    function getPoints(progress) {
      return values.map(function (v, i) {
        const x = padding.left + i * step;
        const y = padding.top + chartH - ((v - min) / range) * chartH * (progress || 1);
        return { x: x, y: y };
      });
    }

    function draw(progress) {
      ctx.clearRect(0, 0, W, H);
      var pts = getPoints(progress);

      // grid lines
      ctx.strokeStyle = 'rgba(140,160,210,0.08)';
      ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) {
        var gy = padding.top + (chartH / 4) * g;
        ctx.beginPath(); ctx.moveTo(padding.left, gy); ctx.lineTo(W - padding.right, gy); ctx.stroke();
      }

      // x labels
      if (labels.length) {
        ctx.fillStyle = 'rgba(140,160,210,0.5)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        var labelStep = Math.max(1, Math.floor(labels.length / 6));
        labels.forEach(function (l, i) {
          if (i % labelStep === 0 || i === labels.length - 1) {
            ctx.fillText(l, padding.left + i * step, H - 8);
          }
        });
      }

      // y labels
      ctx.textAlign = 'right';
      for (var yl = 0; yl <= 4; yl++) {
        var val = min + (range / 4) * (4 - yl);
        ctx.fillText(Math.round(val), padding.left - 8, padding.top + (chartH / 4) * yl + 4);
      }

      if (pts.length < 2) return;

      // fill
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) {
        var cp1x = (pts[i - 1].x + pts[i].x) / 2;
        var cp1y = pts[i - 1].y;
        var cp2x = cp1x;
        var cp2y = pts[i].y;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i].x, pts[i].y);
      }
      ctx.lineTo(pts[pts.length - 1].x, padding.top + chartH);
      ctx.lineTo(pts[0].x, padding.top + chartH);
      ctx.closePath();
      var grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      grad.addColorStop(0, fillColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();

      // line
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var j = 1; j < pts.length; j++) {
        var cx1 = (pts[j - 1].x + pts[j].x) / 2;
        var cy1 = pts[j - 1].y;
        var cx2 = cx1;
        var cy2 = pts[j].y;
        ctx.bezierCurveTo(cx1, cy1, cx2, cy2, pts[j].x, pts[j].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // dots
      pts.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      });
    }

    if (reduceMotion) { draw(1); return; }
    var start = performance.now();
    function animate(now) {
      var p = Math.min(1, (now - start) / 1000);
      draw(easeOutCubic(p));
      if (p < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* ---------- BAR CHART ---------- */
  function drawBarChart(canvas, data, opts) {
    opts = opts || {};
    if (needRetry(canvas, data, opts, drawBarChart)) return;
    if (!data || !data.values || !data.values.length) { drawEmpty(canvas, 'No data yet'); return; }
    var colors = opts.colors || ['#38bdf8', '#818cf8', '#e879f9', '#34d399', '#fbbf24'];
    var padding = { top: 20, right: 16, bottom: 32, left: 40 };
    var dpr = window.devicePixelRatio || 1;

    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = (opts.height || 200) * dpr;
    canvas.style.height = (opts.height || 200) + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var W = rect.width;
    var H = opts.height || 200;
    var chartW = W - padding.left - padding.right;
    var chartH = H - padding.top - padding.bottom;

    var values = data.values || [];
    var labels = data.labels || [];
    var max = Math.max.apply(null, values) || 1;
    var barW = Math.min(40, (chartW / values.length) * 0.6);
    var gap = chartW / values.length;

    function draw(progress) {
      ctx.clearRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = 'rgba(140,160,210,0.08)';
      ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) {
        var gy = padding.top + (chartH / 4) * g;
        ctx.beginPath(); ctx.moveTo(padding.left, gy); ctx.lineTo(W - padding.right, gy); ctx.stroke();
      }

      // y labels
      ctx.fillStyle = 'rgba(140,160,210,0.5)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      for (var yl = 0; yl <= 4; yl++) {
        var val = (max / 4) * (4 - yl);
        ctx.fillText(Math.round(val), padding.left - 8, padding.top + (chartH / 4) * yl + 4);
      }

      values.forEach(function (v, i) {
        var barH = (v / max) * chartH * progress;
        var x = padding.left + i * gap + (gap - barW) / 2;
        var y = padding.top + chartH - barH;
        var c = colors[i % colors.length];

        // bar with rounded top
        var r = Math.min(6, barW / 2);
        ctx.beginPath();
        ctx.moveTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.arcTo(x + barW, y, x + barW, y + r, r);
        ctx.lineTo(x + barW, padding.top + chartH);
        ctx.lineTo(x, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = c;
        ctx.fill();

        // glow
        ctx.shadowColor = c;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // x label
        if (labels[i]) {
          ctx.fillStyle = 'rgba(140,160,210,0.5)';
          ctx.font = '10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(labels[i], x + barW / 2, H - 8);
        }
      });
    }

    if (reduceMotion) { draw(1); return; }
    var start = performance.now();
    function animate(now) {
      var p = Math.min(1, (now - start) / 800);
      draw(easeOutQuart(p));
      if (p < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* ---------- DONUT CHART ---------- */
  function drawDonutChart(canvas, data, opts) {
    opts = opts || {};
    if (needRetry(canvas, data, opts, drawDonutChart)) return;
    var _segs = (data && data.segments) || [];
    if (!_segs.length || !_segs.some(function (s) { return s.value > 0; })) { drawEmpty(canvas, 'No data yet'); return; }
    var thickness = opts.thickness || 28;
    var dpr = window.devicePixelRatio || 1;

    var rect = canvas.getBoundingClientRect();
    var size = Math.min(rect.width, opts.height || 200);
    canvas.width = rect.width * dpr;
    canvas.height = size * dpr;
    canvas.style.height = size + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var cx = rect.width / 2;
    var cy = size / 2;
    var radius = Math.max(2, Math.min(cx, cy) - thickness / 2 - 10);
    var segments = data.segments || [];
    var total = segments.reduce(function (s, seg) { return s + seg.value; }, 0) || 1;

    function draw(progress) {
      ctx.clearRect(0, 0, rect.width, size);
      var startAngle = -Math.PI / 2;

      segments.forEach(function (seg) {
        var sliceAngle = (seg.value / total) * Math.PI * 2 * progress;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
        ctx.strokeStyle = seg.color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.stroke();
        startAngle += sliceAngle + 0.03;
      });

      // center text
      if (progress > 0.8) {
        ctx.fillStyle = 'rgba(238,242,255,0.9)';
        ctx.font = 'bold 28px Sora, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, cx, cy - 8);
        ctx.fillStyle = 'rgba(140,160,210,0.6)';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(opts.centerLabel || 'total', cx, cy + 16);
      }
    }

    if (reduceMotion) { draw(1); return; }
    var start = performance.now();
    function animate(now) {
      var p = Math.min(1, (now - start) / 1000);
      draw(easeOutCubic(p));
      if (p < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* ---------- SPARKLINE ---------- */
  function drawSparkline(canvas, values, opts) {
    opts = opts || {};
    if (needRetry(canvas, values, opts, function (c, v, o) { drawSparkline(c, v, o); })) return;
    if (!values || !values.length) { drawEmpty(canvas, 'No data yet'); return; }
    var color = opts.color || '#38bdf8';
    var dpr = window.devicePixelRatio || 1;

    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = (opts.height || 50) * dpr;
    canvas.style.height = (opts.height || 50) + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var W = rect.width;
    var H = opts.height || 50;
    var pad = 4;
    var max = Math.max.apply(null, values) || 1;
    var min = Math.min.apply(null, values);
    var range = max - min || 1;
    var step = values.length > 1 ? (W - pad * 2) / (values.length - 1) : (W - pad * 2) / 2;

    var pts = values.map(function (v, i) {
      return {
        x: pad + i * step,
        y: pad + (H - pad * 2) - ((v - min) / range) * (H - pad * 2),
      };
    });

    // fill
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(function (p, i) {
      if (i === 0) return;
      var cp = (pts[i - 1].x + p.x) / 2;
      ctx.bezierCurveTo(cp, pts[i - 1].y, cp, p.y, p.x, p.y);
    });
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.lineTo(pts[0].x, H);
    ctx.closePath();
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, withAlpha(color, 0.25));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();

    // line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(function (p, i) {
      if (i === 0) return;
      var cp = (pts[i - 1].x + p.x) / 2;
      ctx.bezierCurveTo(cp, pts[i - 1].y, cp, p.y, p.x, p.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  return { drawLineChart, drawBarChart, drawDonutChart, drawSparkline };
})();
