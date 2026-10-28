const fs = require('fs');
const packageJson = require('./package.json');
const date = new Date();

const formattedDate = date.toLocaleString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
hour12: true
}).replace(',', '');
const versionData = {
  version: packageJson.version,
  buildTime: formattedDate
};

fs.writeFileSync('./src/assets/version.json', JSON.stringify(versionData, null, 2));

console.log("Version file updated:", versionData);