import confetti from 'canvas-confetti';

export function triggerCelebration() {
  // 雙側繽紛煙火效果
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

export function triggerStreakMilestone(days: number) {
  // 針對連勝達標的金色炫彩慶祝
  const colors = ['#f59e0b', '#fbbf24', '#10b981', '#3b82f6', '#ec4899'];
  
  confetti({
    particleCount: Math.min(150, 40 + days * 2),
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors: colors,
    zIndex: 9999
  });
  
  confetti({
    particleCount: Math.min(150, 40 + days * 2),
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors: colors,
    zIndex: 9999
  });
}
