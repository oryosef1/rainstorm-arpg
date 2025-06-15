/* =============================================================================
   RainStorm ARPG - Advanced UI Animation System
   TypeScript Implementation for Smooth UI Transitions and Effects
   ============================================================================= */

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fillMode?: string;
  iterations?: number | string;
}

export interface TransformConfig {
  translateX?: number;
  translateY?: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
}

export class UIAnimator {
  private static readonly DEFAULT_DURATION = 300;
  private static readonly DEFAULT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

  // Core animation methods
  public static animate(
    element: HTMLElement,
    keyframes: Keyframe[] | PropertyIndexedKeyframes,
    options: KeyframeAnimationOptions = {}
  ): Animation {
    const config = {
      duration: this.DEFAULT_DURATION,
      easing: this.DEFAULT_EASING,
      fill: 'forwards' as FillMode,
      ...options
    };

    return element.animate(keyframes, config);
  }

  // Fade animations
  public static fadeIn(element: HTMLElement, duration: number = this.DEFAULT_DURATION): Animation {
    return this.animate(element, [
      { opacity: '0' },
      { opacity: '1' }
    ], { duration });
  }

  public static fadeOut(element: HTMLElement, duration: number = this.DEFAULT_DURATION): Animation {
    return this.animate(element, [
      { opacity: '1' },
      { opacity: '0' }
    ], { duration });
  }

  public static fadeToggle(element: HTMLElement, duration: number = this.DEFAULT_DURATION): Animation {
    const currentOpacity = getComputedStyle(element).opacity;
    const targetOpacity = currentOpacity === '0' ? '1' : '0';
    
    return this.animate(element, [
      { opacity: currentOpacity },
      { opacity: targetOpacity }
    ], { duration });
  }

  // Slide animations
  public static slideDown(element: HTMLElement, duration: number = this.DEFAULT_DURATION): Animation {
    const height = element.scrollHeight;
    
    return this.animate(element, [
      { 
        height: '0px',
        opacity: '0',
        transform: 'translateY(-20px)'
      },
      { 
        height: `${height}px`,
        opacity: '1',
        transform: 'translateY(0)'
      }
    ], { duration });
  }

  public static slideUp(element: HTMLElement, duration: number = this.DEFAULT_DURATION): Animation {
    return this.animate(element, [
      { 
        height: `${element.scrollHeight}px`,
        opacity: '1',
        transform: 'translateY(0)'
      },
      { 
        height: '0px',
        opacity: '0',
        transform: 'translateY(-20px)'
      }
    ], { duration });
  }

  public static slideLeft(element: HTMLElement, duration: number = this.DEFAULT_DURATION): Animation {
    return this.animate(element, [
      { transform: 'translateX(100%)', opacity: '0' },
      { transform: 'translateX(0)', opacity: '1' }
    ], { duration });
  }

  public static slideRight(element: HTMLElement, duration: number = this.DEFAULT_DURATION): Animation {
    return this.animate(element, [
      { transform: 'translateX(-100%)', opacity: '0' },
      { transform: 'translateX(0)', opacity: '1' }
    ], { duration });
  }

  // Scale animations
  public static scaleIn(element: HTMLElement, duration: number = this.DEFAULT_DURATION): Animation {
    return this.animate(element, [
      { 
        transform: 'scale(0)',
        opacity: '0'
      },
      { 
        transform: 'scale(1)',
        opacity: '1'
      }
    ], { 
      duration,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' // Bounce effect
    });
  }

  public static scaleOut(element: HTMLElement, duration: number = this.DEFAULT_DURATION): Animation {
    return this.animate(element, [
      { 
        transform: 'scale(1)',
        opacity: '1'
      },
      { 
        transform: 'scale(0)',
        opacity: '0'
      }
    ], { duration });
  }

  // Rotation animations
  public static rotateIn(element: HTMLElement, duration: number = this.DEFAULT_DURATION): Animation {
    return this.animate(element, [
      { 
        transform: 'rotate(-180deg) scale(0)',
        opacity: '0'
      },
      { 
        transform: 'rotate(0deg) scale(1)',
        opacity: '1'
      }
    ], { duration });
  }

  public static spin(element: HTMLElement, duration: number = 1000): Animation {
    return this.animate(element, [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ], { 
      duration,
      iterations: Infinity
    });
  }

  // Bounce animations
  public static bounceIn(element: HTMLElement, duration: number = this.DEFAULT_DURATION): Animation {
    return this.animate(element, [
      { 
        transform: 'scale(0)',
        opacity: '0'
      },
      { 
        transform: 'scale(1.1)',
        opacity: '1',
        offset: 0.6
      },
      { 
        transform: 'scale(1)',
        opacity: '1'
      }
    ], { 
      duration,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    });
  }

  // Shake animation for errors
  public static shake(element: HTMLElement, duration: number = 500): Animation {
    return this.animate(element, [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' }
    ], { duration });
  }

  // Pulse animation
  public static pulse(element: HTMLElement, duration: number = 1000): Animation {
    return this.animate(element, [
      { transform: 'scale(1)', opacity: '1' },
      { transform: 'scale(1.05)', opacity: '0.8' },
      { transform: 'scale(1)', opacity: '1' }
    ], { 
      duration,
      iterations: Infinity
    });
  }

  // Glow animation
  public static glow(element: HTMLElement, color: string = '#d3915f', duration: number = 2000): Animation {
    return this.animate(element, [
      { 
        boxShadow: `0 0 5px ${color}`,
        filter: 'brightness(1)'
      },
      { 
        boxShadow: `0 0 20px ${color}, 0 0 30px ${color}`,
        filter: 'brightness(1.2)'
      },
      { 
        boxShadow: `0 0 5px ${color}`,
        filter: 'brightness(1)'
      }
    ], { 
      duration,
      iterations: Infinity
    });
  }

  // Typing animation for text
  public static typeWriter(element: HTMLElement, text: string, speed: number = 50): Promise<void> {
    return new Promise((resolve) => {
      element.textContent = '';
      let i = 0;
      
      const timer = setInterval(() => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }

  // Page transition animations
  public static pageTransitionIn(element: HTMLElement): Animation {
    return this.animate(element, [
      { 
        opacity: '0',
        transform: 'translateX(100px) scale(0.9)'
      },
      { 
        opacity: '1',
        transform: 'translateX(0) scale(1)'
      }
    ], { 
      duration: 500,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
  }

  public static pageTransitionOut(element: HTMLElement): Animation {
    return this.animate(element, [
      { 
        opacity: '1',
        transform: 'translateX(0) scale(1)'
      },
      { 
        opacity: '0',
        transform: 'translateX(-100px) scale(0.9)'
      }
    ], { 
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
  }

  // Modal animations
  public static modalIn(overlay: HTMLElement, content: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      // Animate overlay
      const overlayAnimation = this.fadeIn(overlay, 300);
      
      // Animate content
      const contentAnimation = this.animate(content, [
        { 
          opacity: '0',
          transform: 'scale(0.8) translateY(-50px)'
        },
        { 
          opacity: '1',
          transform: 'scale(1) translateY(0)'
        }
      ], { 
        duration: 400,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      });

      contentAnimation.addEventListener('finish', () => resolve());
    });
  }

  public static modalOut(overlay: HTMLElement, content: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      // Animate content
      const contentAnimation = this.animate(content, [
        { 
          opacity: '1',
          transform: 'scale(1) translateY(0)'
        },
        { 
          opacity: '0',
          transform: 'scale(0.8) translateY(-50px)'
        }
      ], { duration: 200 });

      // Animate overlay
      const overlayAnimation = this.fadeOut(overlay, 300);

      overlayAnimation.addEventListener('finish', () => resolve());
    });
  }

  // Notification animations
  public static notificationSlideIn(element: HTMLElement, fromSide: 'left' | 'right' | 'top' | 'bottom' = 'right'): Animation {
    const transforms = {
      left: ['translateX(-100%)', 'translateX(0)'],
      right: ['translateX(100%)', 'translateX(0)'],
      top: ['translateY(-100%)', 'translateY(0)'],
      bottom: ['translateY(100%)', 'translateY(0)']
    };

    return this.animate(element, [
      { 
        opacity: '0',
        transform: transforms[fromSide][0]
      },
      { 
        opacity: '1',
        transform: transforms[fromSide][1]
      }
    ], { 
      duration: 400,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    });
  }

  // Loading animations
  public static loadingDots(container: HTMLElement): Animation {
    const dots = container.querySelectorAll('.loading-dot');
    const animations: Animation[] = [];

    dots.forEach((dot, index) => {
      const animation = this.animate(dot as HTMLElement, [
        { transform: 'scale(0)', opacity: '0.3' },
        { transform: 'scale(1)', opacity: '1' },
        { transform: 'scale(0)', opacity: '0.3' }
      ], {
        duration: 1400,
        iterations: Infinity,
        delay: index * 160
      });
      animations.push(animation);
    });

    // Return the first animation as representative
    return animations[0];
  }

  // Progress bar animation
  public static animateProgressBar(
    progressBar: HTMLElement, 
    fromPercent: number, 
    toPercent: number, 
    duration: number = 1000
  ): Animation {
    return this.animate(progressBar, [
      { width: `${fromPercent}%` },
      { width: `${toPercent}%` }
    ], { 
      duration,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
  }

  // Stagger animations for lists
  public static staggerIn(elements: NodeListOf<Element> | Element[], staggerDelay: number = 100): Promise<void> {
    return new Promise((resolve) => {
      const animations: Animation[] = [];
      
      elements.forEach((element, index) => {
        const animation = this.animate(element as HTMLElement, [
          { 
            opacity: '0',
            transform: 'translateY(20px)'
          },
          { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        ], {
          duration: 400,
          delay: index * staggerDelay,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
        animations.push(animation);
      });

      // Resolve when the last animation finishes
      if (animations.length > 0) {
        animations[animations.length - 1].addEventListener('finish', () => resolve());
      } else {
        resolve();
      }
    });
  }

  // Utility methods
  public static wait(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  public static sequence(...animations: Array<() => Animation | Promise<any>>): Promise<void> {
    return animations.reduce(
      (promise, animationFn) => promise.then(() => {
        const result = animationFn();
        return result instanceof Animation 
          ? new Promise(resolve => result.addEventListener('finish', resolve))
          : result;
      }),
      Promise.resolve()
    );
  }

  public static parallel(...animations: Array<() => Animation>): Promise<void> {
    const animationPromises = animations.map(animationFn => {
      const animation = animationFn();
      return new Promise<void>(resolve => animation.addEventListener('finish', () => resolve()));
    });

    return Promise.all(animationPromises).then(() => {});
  }
}

// Specific ARPG UI animations
export class ARPGUIAnimations extends UIAnimator {
  // Inventory item hover effects
  public static inventoryItemHover(element: HTMLElement): Animation {
    return this.animate(element, [
      { 
        transform: 'scale(1)',
        filter: 'brightness(1)',
        boxShadow: '0 0 0 rgba(211, 145, 95, 0)'
      },
      { 
        transform: 'scale(1.05)',
        filter: 'brightness(1.2)',
        boxShadow: '0 0 15px rgba(211, 145, 95, 0.6)'
      }
    ], { duration: 200 });
  }

  // Item rarity glow effects
  public static legendaryItemGlow(element: HTMLElement): Animation {
    return this.animate(element, [
      { 
        boxShadow: '0 0 10px #ff6b35',
        filter: 'brightness(1)'
      },
      { 
        boxShadow: '0 0 25px #ff6b35, 0 0 35px #ff6b35',
        filter: 'brightness(1.3)'
      },
      { 
        boxShadow: '0 0 10px #ff6b35',
        filter: 'brightness(1)'
      }
    ], { 
      duration: 2000,
      iterations: Infinity
    });
  }

  // Skill tree node activation
  public static skillNodeActivate(element: HTMLElement): Animation {
    return this.animate(element, [
      { 
        transform: 'scale(1)',
        boxShadow: '0 0 0 rgba(211, 145, 95, 0)'
      },
      { 
        transform: 'scale(1.3)',
        boxShadow: '0 0 30px rgba(211, 145, 95, 0.8)'
      },
      { 
        transform: 'scale(1.1)',
        boxShadow: '0 0 15px rgba(211, 145, 95, 0.6)'
      }
    ], { 
      duration: 600,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    });
  }

  // Health/Mana orb effects
  public static resourceOrbPulse(element: HTMLElement, color: string): Animation {
    return this.animate(element, [
      { 
        transform: 'scale(1)',
        boxShadow: `0 0 10px ${color}`
      },
      { 
        transform: 'scale(1.1)',
        boxShadow: `0 0 25px ${color}, 0 0 35px ${color}`
      },
      { 
        transform: 'scale(1)',
        boxShadow: `0 0 10px ${color}`
      }
    ], { 
      duration: 1000,
      iterations: Infinity
    });
  }

  // Damage number popup
  public static damageNumber(
    element: HTMLElement, 
    isCritical: boolean = false, 
    isHeal: boolean = false
  ): Animation {
    const scale = isCritical ? 1.5 : 1.2;
    const distance = isCritical ? -100 : -80;
    
    return this.animate(element, [
      { 
        opacity: '1',
        transform: 'translateY(0) scale(1)'
      },
      { 
        opacity: '1',
        transform: `translateY(-20px) scale(${scale})`,
        offset: 0.2
      },
      { 
        opacity: '0',
        transform: `translateY(${distance}px) scale(0.8)`
      }
    ], { 
      duration: isCritical ? 1800 : 1500,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
  }

  // Quest completion celebration
  public static questComplete(element: HTMLElement): Animation {
    return this.animate(element, [
      { 
        transform: 'scale(0) rotate(-180deg)',
        opacity: '0'
      },
      { 
        transform: 'scale(1.2) rotate(0deg)',
        opacity: '1',
        offset: 0.6
      },
      { 
        transform: 'scale(1) rotate(0deg)',
        opacity: '1'
      }
    ], { 
      duration: 800,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    });
  }

  // Level up effect
  public static levelUpEffect(element: HTMLElement): Animation {
    return this.animate(element, [
      { 
        transform: 'scale(1)',
        filter: 'brightness(1) hue-rotate(0deg)',
        boxShadow: '0 0 0 rgba(255, 221, 68, 0)'
      },
      { 
        transform: 'scale(1.2)',
        filter: 'brightness(1.5) hue-rotate(30deg)',
        boxShadow: '0 0 40px rgba(255, 221, 68, 0.8)',
        offset: 0.5
      },
      { 
        transform: 'scale(1)',
        filter: 'brightness(1) hue-rotate(0deg)',
        boxShadow: '0 0 10px rgba(255, 221, 68, 0.4)'
      }
    ], { 
      duration: 1500,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    });
  }

  // Map portal effect
  public static portalEffect(element: HTMLElement): Animation {
    return this.animate(element, [
      { 
        transform: 'scale(0) rotate(0deg)',
        opacity: '0',
        filter: 'blur(10px)'
      },
      { 
        transform: 'scale(1.1) rotate(180deg)',
        opacity: '0.8',
        filter: 'blur(2px)',
        offset: 0.7
      },
      { 
        transform: 'scale(1) rotate(360deg)',
        opacity: '1',
        filter: 'blur(0px)'
      }
    ], { 
      duration: 1200,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    });
  }
}

// Animation utility functions
export const AnimationUtils = {
  // Check if animations are supported
  supportsAnimations(): boolean {
    return typeof Element !== 'undefined' && 'animate' in Element.prototype;
  },

  // Check if user prefers reduced motion
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get safe animation duration (respects user preferences)
  getSafeDuration(duration: number): number {
    return this.prefersReducedMotion() ? Math.min(duration, 150) : duration;
  },

  // Create CSS custom properties for dynamic animations
  setCSSAnimationProperties(element: HTMLElement, properties: Record<string, string>): void {
    Object.entries(properties).forEach(([property, value]) => {
      element.style.setProperty(`--${property}`, value);
    });
  }
};