const { generateIcons } = require('icon-gen');
const path = require('path');

const options = {
  ico: {
    name: 'icon',
    sizes: [16, 24, 32, 48, 64, 128, 256],
  },
};

const input = path.join(__dirname, '../assets/claude_surf.png');
const output = path.join(__dirname, '../assets');

generateIcons(input, output, options)
  .then((results) => {
    console.log('✓ Windows icon created: icon.ico');
    console.log(results);
  })
  .catch((err) => {
    console.error('Error creating .ico:', err);
    process.exit(1);
  });
