/* ==========================================================================
   INTERACTIVITÉ DU SITE BDA & EFFET CANVAS MUSIQUE SOURIS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  let canvas = document.getElementById('cursor-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'cursor-canvas';
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';

  const particles = [];

  const symbolFiles = [
    './images/music1.png',
    './images/music2.png',
    './images/music3.png'
  ];

  const sparkImages = symbolFiles.map(src => {
    const img = new Image();
    img.src = src;
    return img;
  });

  class SparkParticle {
    constructor(x, y) {
      // Position de départ exacte de la souris
      this.x = x;
      this.y = y;
      
      // Position cible vers laquelle la note va glisser (effet de lag organique)
      this.targetX = x;
      this.targetY = y + (Math.random() - 0.5) * 6;

      this.size = 22; 
      this.angle = (Math.random() - 0.5) * 0.5;
      this.spin = 0; 
      this.alpha = 1;
      this.decay = 0.03; // Laisse un peu plus de temps pour voir la traînée s'étirer

      this.image = sparkImages[Math.floor(Math.random() * sparkImages.length)];
    }

    update() {
      // EFFET DE LAG / AMORTISSEMENT (Lerp) : 
      // La note se rapproche doucement de sa position cible au lieu d'y être instantanément
      this.x += (this.targetX - this.x) * 0.15;
      this.y += (this.targetY - this.y) * 0.15;

      this.angle += this.spin;
      this.alpha -= this.decay;
    }

    draw() {
      if (this.alpha <= 0 || !this.image.complete) return;

      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.globalCompositeOperation = 'source-over';

      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      ctx.drawImage(
        this.image,
        -this.size / 2,
        -this.size / 2,
        this.size,
        this.size
      );

      ctx.restore();
    }
  }

  function createSparks(x, y) {
    // On espace légèrement la création pour ne pas saturer, 
    // ce qui accentue l'effet de traînée souple
    if (Math.random() < 0.6) {
      particles.push(new SparkParticle(x, y));
    }
  }

  window.addEventListener('mousemove', (e) => {
    createSparks(e.clientX, e.clientY);
  });

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      createSparks(e.touches.length > 0 ? e.touches[0].clientX : e.clientX, e.touches.length > 0 ? e.touches[0].clientY : e.clientY);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      createSparks(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();

      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  }

  animate();


  /* ------------------------------------------------------------------------
     2. LECTEUR AUDIO IPOD
     ------------------------------------------------------------------------ */
  const audioPlayer = document.getElementById('ipod-audio-player');
  const trackTitle = document.getElementById('ipod-track-title');
  const trackItems = document.querySelectorAll('.ipod-track-item');

  let currentItem = null;

  trackItems.forEach(item => {
    item.addEventListener('click', () => {
      const src = item.getAttribute('data-src');
      if (!src || !audioPlayer) return;

      // Toggle pause if clicking the active currently playing track
      if (currentItem === item && !audioPlayer.paused) {
        audioPlayer.pause();
        trackTitle.textContent = 'Paused';
        return;
      }

      // Resume if clicking the same track that was paused
      if (currentItem === item && audioPlayer.paused) {
        audioPlayer.play().then(() => {
          trackTitle.textContent = item.textContent.trim();
        }).catch(err => {
          console.error('Resume error:', err);
        });
        return;
      }

      // Switching to a new track
      currentItem = item;
      trackItems.forEach(t => t.classList.remove('active'));
      item.classList.add('active');

      trackTitle.textContent = 'Loading...';
      audioPlayer.src = src;
      audioPlayer.load();

      audioPlayer.play().then(() => {
        trackTitle.textContent = item.textContent.trim();
      }).catch(err => {
        console.error('Playback error:', err);
        trackTitle.textContent = 'Playback error';
      });
    });
  });

  if (audioPlayer) {
    audioPlayer.addEventListener('ended', () => {
      if (trackTitle) trackTitle.textContent = 'Finished';
      trackItems.forEach(t => t.classList.remove('active'));
      currentItem = null;
    });
  }

});
