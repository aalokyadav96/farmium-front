function layoutMasonry(containerSelector, columnCount, gap = 10) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
  
    const items = Array.from(container.children);
    const containerWidth = container.clientWidth;
    const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
    const columnHeights = Array(columnCount).fill(0);
  
    items.forEach(item => {
      item.style.width = `${columnWidth}px`;
  
      // Wait for rendering to get accurate height
      const minCol = columnHeights.indexOf(Math.min(...columnHeights));
      const x = (columnWidth + gap) * minCol;
      const y = columnHeights[minCol];
  
      item.style.transform = `translate(${x}px, ${y}px)`;
      item.style.position = 'absolute';
  
      columnHeights[minCol] += item.offsetHeight + gap;
    });
  
    const maxHeight = Math.max(...columnHeights);
    container.style.height = `${maxHeight}px`;
  }
  
  // Re-layout on load and resize
  window.addEventListener('load', () => layoutMasonry('#masonry', 3, 12));
  window.addEventListener('resize', () => layoutMasonry('#masonry', 3, 12));
  