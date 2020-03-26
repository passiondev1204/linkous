export default {
  pattern_distance: (counts, index, dis) => {
    let deeps = Math.ceil(counts / 20);
    // console.log((index % deeps), 'aaa')
    return dis / (index % deeps + 1);
  },
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
  randomRange: (min, max) => Math.random() * (max - min) + min,
  clone: val => JSON.parse(JSON.stringify(val)),
  getIconSize: linkCounts => {
    if(linkCounts <= 5) {
      return "ei-lg";
    } else if (linkCounts <= 10) {
      return "ei-2x";
    } else if (linkCounts <= 50) {
      return "ei-3x";
    } else if (linkCounts <= 100) {
      return "ei-4x"
    } else
      return "ei-5x";
  },
  filteredList:(lists, search) => {
    let filtered_list = [];
    lists.forEach(item => {
      const subMatches = Object.values(item).filter(val => val.toString().toLowerCase().includes(search.toLowerCase()));
      if(subMatches.length > 0) {        
        filtered_list.push(item);
      }
    })    
    filtered_list = [...new Set(filtered_list)];
    return filtered_list;
  }
};
