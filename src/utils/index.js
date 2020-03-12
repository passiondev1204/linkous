export default {
  distance: (x1, y1, x2, y2) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)),
  randomColor: () => {
    const num = Math.round(0xffffff * Math.random());
    const r = num >> 16;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return {
      rgb: `rgb(${r}, ${g}, ${b})`,
      rgba: `rgb(${r}, ${g}, ${b}, 0.1)`
    };
  },
  randomRange: (min, max) => Math.random() * (max - min) + min
};
