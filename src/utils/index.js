import { red, blue, yellow, orange } from "@material-ui/core/colors";
export default {
  pattern_distance: (counts, index, dis) => {
    let deeps = Math.ceil(counts / 20);
    // console.log((index % deeps), 'aaa')
    return dis / ((index % deeps) + 1);
  },
  distance: (x1, y1, x2, y2) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)),
  randomColor: () => {
    const num = Math.round(0xffffff * Math.random());
    const r = num >> 16;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgb(${r}, ${g}, ${b})`;
  },
  randomRange: (min, max) => Math.random() * (max - min) + min,
  clone: val => JSON.parse(JSON.stringify(val)),
  getIconSize: linkCounts => {
    if (linkCounts <= 5) {
      return "ei-lg";
    } else if (linkCounts <= 50) {
      return "ei-2x";
    } else if (linkCounts <= 100) {
      return "ei-3x";
    } else if (linkCounts <= 500) {
      return "ei-4x";
    } else return "ei-5x";
  },
  filteredList: (lists, search) => {
    let filtered_list = [];
    lists.forEach(item => {
      const subMatches = Object.values(item).filter(val =>
        val
          .toString()
          .toLowerCase()
          .includes(search.toLowerCase())
      );
      if (subMatches.length > 0) {
        filtered_list.push(item);
      }
    });
    filtered_list = [...new Set(filtered_list)];
    return filtered_list;
  },
  getRandomColors: counts => {
    const initialColor = Math.floor(Math.random() * 360);
    const increment = 360 / counts;
    const hsls = [];
    for (let i = 0; i < counts; i++) {
      hsls.push(
        `hsl(${Math.round((initialColor + i * increment) % 360)}, 100%, 50%)`
      );
    }
    return hsls;
  },
  getRandomInRange: (min, max) =>
    Math.floor(Math.random() * (max - min + 1) + min),
  checkInfoAvailable: value => value || "N/A",
  flattern: obj => {
    let newObj = {};
    const available_keys = [
      "id",
      "name",
      "ip",
      "mask",
      "rs",
      "level",
      "vulnerabilities",
      "software",
      "conditions",
      "av",
      "os",
      "icon",
      "browser",
      "rce",
      "lpe",
      "config",
      "dau",
      "ea"
    ];
    Object.entries(obj).forEach(entry => {
      if (entry[0] !== "Software" && entry[0] !== "Conditions") {
        if (available_keys.includes(entry[0].toLowerCase())) {
          newObj[entry[0]] = entry[1];
        }
      } else {
        Object.entries(entry[1][0]).forEach(subEntry => {
          if (subEntry[0] !== "Vulnerabilities") {
            if (available_keys.includes(subEntry[0].toLowerCase())) {
              newObj[subEntry[0]] = subEntry[1];
            }
          }
        });
      }
    });
    return newObj;
  },
  successColor: value => {
    if (value >= 0 && value <= 16) {
      return blue[500];
    } else if (value >= 17 && value <= 37) {
      return blue[200];
    } else if (value >= 38 && value <= 68) {
      return yellow[500];
    } else if (value >= 69 && value <= 79) {
      return orange[500];
    } else {
      return red[500];
    }
  }
};
