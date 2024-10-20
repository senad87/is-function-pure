const fs = require('fs');

function getCount(countFilePath) {
  return parseInt(fs.readFileSync(countFilePath, 'utf8'), 10);
}

function updateCount(countFilePath, count) {
  fs.writeFileSync(countFilePath, count);
}

module.exports = {
  getCount,
  updateCount
};
