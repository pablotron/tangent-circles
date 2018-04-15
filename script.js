jQuery(function($) {
  "use strict";

  var ctx = document.getElementById('canvas').getContext('2d');

  var grab = null, show_details = false, circles = [];

  function reset() {
    circles = [{
      x: ctx.canvas.clientWidth / 2.0 - 100,
      y: ctx.canvas.clientHeight / 2,
      r: 50,
    }, {
      x: ctx.canvas.clientWidth / 2.0 + 100,
      y: ctx.canvas.clientHeight / 2,
      r: 40,
    }];

    return false;
  }

  function draw_circles() {
    // draw circles
    $.each(circles, function(i, c) {
      ctx.strokeStyle = (grab && (i == grab.i)) ? 'red' : 'black';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI);
      ctx.stroke();
    });
  }

  function magnitude(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  function normalize(v) {
    var inv_m = 1.0 / magnitude(v);

    return {
      x: v.x * inv_m,
      y: v.y * inv_m,
    };
  }

  function draw_tangent_circle() {
    // calculate v0
    var v0 = {
      x: circles[1].x - circles[0].x,
      y: circles[1].y - circles[0].y,
    }, mag_v0 = magnitude(v0);

    // cache radii
    var r0 = circles[0].r,
        r1 = circles[1].r;

    // calc d0, d1
    var d0 = 1.0 * r0/(r0 + r1) * (mag_v0 - (r0 + r1)),
        d1 = 1.0 * r1/(r0 + r1) * (mag_v0 - (r0 + r1));

    // calc c2 radius
    var r2 = (2 * r0 * d0 + -2 * r1 * d1 + d0 * d0 + -d1 * d1) / (2.0 * (r0 - r1));

    // normalize v0
    var n0 = normalize(v0);

    // calc cos/sin theta
    var cos_theta = 1.0 * (r0 + d0)/(r0 + r2),
        sin_theta = -Math.sqrt(
          (r0 + r2) * (r0 + r2) - (r0 + d0) * (r0 + d0)
        ) / (r0 + r2);

    // calc/normalize v1
    var n1 = normalize({
      x: cos_theta * n0.x + -sin_theta * n0.y,
      y: sin_theta * n0.x +  cos_theta * n0.y,
    });

    // calc p2
    var p2 = {
      x: circles[0].x + (r0 + r2) * n1.x,
      y: circles[0].y + (r0 + r2) * n1.y,
    };

    // calc n2
    var n2 = normalize({
      x: -(p2.x - (circles[0].x + n0.x * (r0 + d0))),
      y: -(p2.y - (circles[0].y + n0.y * (r0 + d0))),
    });

    // calc p3
    var p3 = {
      x: p2.x + r2 * n2.x,
      y: p2.y + r2 * n2.y,
    };

    if (show_details) {
      ctx.strokeStyle = 'blue';

      // start lines path
      ctx.beginPath();

      // draw line from p2 to p1
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(circles[1].x, circles[1].y);

      // draw line from p1 to p0
      ctx.lineTo(circles[0].x, circles[0].y);

      // draw line from p0 to p2
      ctx.lineTo(p2.x, p2.y);

      // draw line from p2 to p3
      ctx.lineTo(p3.x, p3.y);

      // stroke lines
      ctx.setLineDash([2, 2]);
      ctx.stroke();

      // draw tangent circle
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, r2, 0, 2 * Math.PI);

      // stroke tangent circle
      ctx.setLineDash([]);
      ctx.stroke();
    }

    // draw p3
    ctx.beginPath();
    ctx.arc(p3.x, p3.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  function draw() {
    // clear canvas
    ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);

    // draw circles
    draw_circles();

    // draw tangent circle and point
    draw_tangent_circle();
  }

  $('#canvas').mousemove(function(ev) {
    if (grab != null) {
      // get event coords and selected circle
      var x = ev.offsetX, y = ev.offsetY,
          c = circles[grab.i];

      if (grab.move) {
        // move circle
        c.x = x;
        c.y = y;
      } else {
        // resize circle
        c.r = Math.sqrt(
          (c.x - x) * (c.x - x) + (c.y - y) * (c.y - y)
        );
      }

      // refresh canvas
      draw();
    }

    // stop event
    return false;
  }).mousedown(function(ev) {
    $.each(circles, function(i, c) {
      if (grab == null) {
        var x = ev.offsetX, y = ev.offsetY,
            d = Math.sqrt((c.x - x) * (c.x - x) + (c.y - y) * (c.y - y));

        if (d < c.r) {
          // select circle
          grab = {
            i: i,
            move: ((1.0 * d) / c.r) < 0.7
          };
        }

        draw();
      }
    });

    // stop event
    return false;
  }).mouseup(function(ev) {
    if (grab != null) {
      // clear grab
      grab = null;

      // refresh
      draw();
    }

    // stop event
    return false;
  });

  $('#toggle-details').click(function() {
    // toggle show details
    show_details = !show_details;

    // refresh canvas
    draw();

    // stop event
    return false;
  });

  $('#reset').click(function() {
    // reset circles
    reset();

    // refresh canvas
    draw()

    // stop event
    return false;
  }).click();
});
