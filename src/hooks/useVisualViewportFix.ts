import { useEffect } from 'react';

/**
 * iOS Safari viewport shift fix.
 *
 * When a keyboard opens, iOS scrolls the visual viewport upward to keep the
 * focused input visible. Because `position: fixed` elements are anchored to
 * the visual viewport, they drift up with it — causing the FAB and sheets to
 * appear to float toward the top of the screen.
 *
 * Fix: listen to `visualViewport.scroll` and apply a counter-`translateY` to
 * `#root` so that its fixed-position descendants remain visually stable.
 * When the keyboard is closed `offsetTop` is 0, so there is no visual change.
 *
 * NOTE: applying `transform` to an ancestor of `position: fixed` elements
 * causes those elements to be fixed relative to the transformed ancestor
 * rather than the viewport. Because `#root` fills the screen this is
 * equivalent in the normal (no-keyboard) case, and correct in the shifted
 * (keyboard-open) case.
 */
export function useVisualViewportFix() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.getElementById('root');
    if (!root) return;

    function update() {
      root!.style.transform =
        vv!.offsetTop > 0 ? `translateY(${vv!.offsetTop}px)` : '';
    }

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.style.transform = '';
    };
  }, []);
}
