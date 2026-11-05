/* Keep the same run control after the results, docking only when outside view. */
(() => {
  const root = document.querySelector('#taskDetailPanel');
  if (!root) return;
  const entries = new Map();
  let frame = 0;
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const resize = new ResizeObserver(schedule);
  resize.observe(root);

  function visibleBounds(scroller) {
    const rect = scroller.getBoundingClientRect();
    let top = Math.max(0, rect.top), bottom = Math.min(window.innerHeight, rect.bottom);
    for (let parent = scroller.parentElement; parent; parent = parent.parentElement) {
      if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(parent).overflowY)) {
        const bounds = parent.getBoundingClientRect();
        top = Math.max(top, bounds.top);
        bottom = Math.min(bottom, bounds.bottom);
      }
    }
    return { top, bottom };
  }

  function move(control, destination) {
    if (control.parentElement === destination) return;
    const focused = control.contains(document.activeElement) ? document.activeElement : null;
    destination.appendChild(control);
    focused?.focus({ preventScroll: true });
  }

  function update() {
    frame = 0;
    for (const [slot, entry] of entries) {
      if (!root.contains(slot)) {
        entry.observed.forEach(element => resize.unobserve(element));
        entry.dock.remove();
        entries.delete(slot);
      }
    }
    root.querySelectorAll('[data-output-run-slot]').forEach(slot => {
      if (entries.has(slot)) return;
      const scroller = slot.closest('.song-studio-scroll,.ref-workbench-content');
      const panel = scroller?.closest('.song-studio-panel,.ref-workbench-panel');
      const control = slot.firstElementChild;
      if (!panel || !control) return;
      panel.classList.add('task-output-run-panel');
      const dock = document.createElement('div');
      dock.className = 'task-output-run-dock';
      dock.hidden = true;
      panel.appendChild(dock);
      const observed = [...new Set([slot, control, scroller, panel, slot.previousElementSibling].filter(Boolean))];
      observed.forEach(element => resize.observe(element));
      entries.set(slot, { control, scroller, panel, dock, observed });
    });
    for (const [slot, { control, scroller, panel, dock }] of entries) {
      const panelRect = panel.getBoundingClientRect(), scrollRect = scroller.getBoundingClientRect();
      const { top, bottom } = visibleBounds(scroller);
      if (scrollRect.width <= 0 || bottom <= top) { dock.hidden = true; continue; }
      const height = Math.max(40, control.getBoundingClientRect().height);
      // Preserve the original slot so docking never changes scroll height or position.
      const slotHeight = `${height + 16}px`;
      if (slot.style.minHeight !== slotHeight) slot.style.minHeight = slotHeight;
      const rect = slot.getBoundingClientRect();
      const visible = rect.top + 16 >= top - 1 && rect.top + 16 + height <= bottom + 1;
      if (visible) {
        move(control, slot);
        dock.hidden = true;
      } else {
        const padding = getComputedStyle(scroller);
        dock.hidden = false;
        dock.style.left = `${scrollRect.left - panelRect.left + parseFloat(padding.paddingLeft)}px`;
        dock.style.width = `${scroller.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight)}px`;
        dock.style.top = `${Math.max(top, bottom - height - 12) - panelRect.top}px`;
        dock.style.backgroundColor = getComputedStyle(panel).backgroundColor;
        move(control, dock);
      }
    }
  }
  // Child-list observation covers task switches and regenerated output without
  // responding to audio progress/style updates or our positioning attributes.
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  root.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
  schedule();
})();
