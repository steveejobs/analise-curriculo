---
description: a
---

# Ren Software Design System
## Minimalista, Elegante, Surpreendente

> Apple + Notion + Google = Clean com impacto

---

## 🎨 Cores (Só 6)

```css
--white:    #FFFFFF;  /* 90% do site */
--blue:     #1E5FA3;  /* CTAs, links - o protagonista */
--dark:     #0A0F1A;  /* Texto, footer */
--gray-bg:  #F7F9FC;  /* Sections alternadas */
--gray-border: #E1E8ED;  /* Bordas invisíveis */
--gray-text: #6B7684;  /* Texto secundário */
```

**Regra:** Fundo branco, azul só onde importa, texto sempre dark.

---

## 📝 Tipografia

```css
font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;

/* Tamanhos */
--text-xs:  14px;  /* Captions */
--text-sm:  16px;  /* Corpo */
--text-md:  20px;  /* Subtítulos */
--text-lg:  32px;  /* Títulos */
--text-xl:  56px;  /* Hero */

/* Pesos */
--regular:  400;
--medium:   500;
--semibold: 600;
--bold:     700;
```

---

## 📐 Espaçamento (8px grid)

```css
--space-1:  8px;
--space-2:  16px;
--space-3:  24px;
--space-4:  32px;
--space-6:  48px;
--space-8:  64px;
--space-12: 96px;
--space-16: 128px;
```

---

## 🎭 Sombras

```css
--shadow-sm: 0 1px 3px rgba(10,15,26,0.06);
--shadow-md: 0 4px 12px rgba(10,15,26,0.08);
--shadow-lg: 0 12px 24px rgba(10,15,26,0.12);
--shadow-blue: 0 8px 24px rgba(30,95,163,0.15);
```

---

## 🎬 Animações Premium

### Universal Transition
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Fade In Up (Apple style)
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Hover Levitate
```css
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-blue);
}
```

### Link Underline
```css
.link {
  position: relative;
  text-decoration: none;
}

.link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--blue);
  transition: width 0.3s ease;
}

.link:hover::after {
  width: 100%;
}
```

### Button Ripple
```javascript
btn.addEventListener('click', function(e) {
  const ripple = document.createElement('span');
  const rect = this.getBoundingClientRect();
  ripple.style.left = (e.clientX - rect.left) + 'px';
  ripple.style.top = (e.clientY - rect.top) + 'px';
  ripple.className = 'ripple';
  this.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});
```

```css
.ripple {
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  transform: translate(-50%, -50%);
  animation: ripple-anim 0.6s ease-out;
}

@keyframes ripple-anim {
  to {
    width: 500px;
    height: 500px;
    opacity: 0;
  }
}
```

### Scroll Reveal
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));
```

```css
.animate-in {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-in.visible {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 🎯 Componentes

### Botão Primário
```css
.btn-primary {
  background: var(--blue);
  color: var(--white);
  padding: 14px 32px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-blue);
}
```

### Botão Ghost
```css
.btn-ghost {
  background: transparent;
  color: var(--blue);
  padding: 14px 32px;
  border-radius: 12px;
  border: 2px solid var(--gray-border);
  transition: all 0.3s;
}

.btn-ghost:hover {
  border-color: var(--blue);
  background: rgba(30,95,163,0.05);
}
```

### Input
```css
.input {
  width: 100%;
  padding: 16px;
  border: 2px solid var(--gray-border);
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s;
}

.input:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 4px rgba(30,95,163,0.1);
}
```

### Card
```css
.card {
  background: var(--white);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid var(--gray-border);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: var(--shadow-lg);
  border-color: transparent;
}
```

---

## 🌟 Efeitos Premium

### Glass Effect
```css
.glass {
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.3);
}
```

### Gradient Text
```css
.gradient-text {
  background: linear-gradient(135deg, var(--blue) 0%, #00D4AA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Bento Grid (Notion style)
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.bento-item {
  background: var(--white);
  border: 1px solid var(--gray-border);
  border-radius: 20px;
  padding: 32px;
  transition: all 0.4s;
}

.bento-item:hover {
  border-color: var(--blue);
  transform: translateY(-4px);
}
```

---

## 📱 Hero Section (Apple Style)

```html
<section class="hero">
  <h1 class="hero-title animate-in">
    Transforme suas ideias<br>em software extraordinário
  </h1>
  <p class="hero-subtitle animate-in">
    Desenvolvimento que impressiona. Performance que inspira.
  </p>
  <div class="hero-cta animate-in">
    <button class="btn-primary">Começar agora</button>
    <button class="btn-ghost">Ver projetos</button>
  </div>
</section>
```

```css
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 96px 24px;
  text-align: center;
  background: radial-gradient(circle at 30% 50%, 
    rgba(30,95,163,0.05) 0%, transparent 50%), var(--white);
}

.hero-title {
  font-size: 56px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -2px;
  color: var(--dark);
  margin-bottom: 24px;
}

.hero-subtitle {
  font-size: 20px;
  color: var(--gray-text);
  margin-bottom: 40px;
  max-width: 600px;
}

.hero-cta {
  display: flex;
  gap: 16px;
}
```

---

## 🎯 Features Grid

```html
<section class="features">
  <h2>Por que nos escolher</h2>
  <div class="features-grid">
    <div class="feature-card animate-in">
      <div class="feature-icon">⚡</div>
      <h3>Performance Extrema</h3>
      <p>Código otimizado para velocidade máxima</p>
    </div>
    <!-- mais cards -->
  </div>
</section>
```

```css
.features {
  padding: 128px 24px;
  background: var(--gray-bg);
}

.features h2 {
  font-size: 32px;
  text-align: center;
  margin-bottom: 64px;
  color: var(--dark);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: var(--white);
  padding: 40px 32px;
  border-radius: 20px;
  border: 1px solid var(--gray-border);
  transition: all 0.4s;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
  border-color: var(--blue);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 24px;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 12px;
}

.feature-card p {
  font-size: 16px;
  color: var(--gray-text);
  line-height: 1.6;
}
```

---

## 📐 Responsivo

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (max-width: 768px) {
  .hero-title { font-size: 40px; }
  .features-grid { grid-template-columns: 1fr; }
  .hero-cta { flex-direction: column; width: 100%; }
  .btn-primary, .btn-ghost { width: 100%; }
}

@media (max-width: 480px) {
  .hero-title { font-size: 32px; letter-spacing: -1px; }
}
```

---

## 🎯 Princípios do Design

1. **Espaço em Branco = Luxo** — Use muito, não tenha medo do vazio
2. **Menos Cores = Mais Impacto** — Azul só nos CTAs
3. **Animações Sutis** — Suaves, quase imperceptíveis
4. **Tipografia Grande** — Hero 56px+, corpo 16px+
5. **Cantos Arredondados** — 12-20px sempre
6. **Sombras Leves** — Quase invisíveis, aparecem no hover
7. **Performance** — 60fps, <3s load time

---

## ✅ Checklist Rápido

**Essencial:**
- [ ] Fonte system (-apple-system)
- [ ] 6 cores (branco, azul, dark, 3 grays)
- [ ] Espaçamento 8px base
- [ ] Border-radius 12-20px
- [ ] Transições 0.3s
- [ ] FadeInUp animation

**Premium:**
- [ ] Scroll reveal
- [ ] Card hover com scale
- [ ] Button ripple
- [ ] Link underline animado
- [ ] Glass effect

**Wow Factor:**
- [ ] Parallax
- [ ] Gradient text
- [ ] Bento grid

---

**Filosofia Final:**  
"Menos features, mais polish. Menos cores, mais harmonia. Menos animação, mais sofisticação."

🚀 **Este sistema faz o usuário perguntar: "Como fizeram isso?"**