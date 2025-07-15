// utils/scrollState.js
export function restoreScroll(container, state) {
    if (state?.scrollY) container.scrollTop = state.scrollY;
  }
  
  export function saveScroll(container, state) {
    state.scrollY = container?.scrollTop || 0;
  }
  