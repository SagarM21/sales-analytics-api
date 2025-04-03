const fs = require('fs');
const csv = require('csv-parser');

const results = [];

fs.createReadStream('products.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    // console.log(JSON.stringify(results, null, 2)); 
    
    fs.writeFileSync('products.json', JSON.stringify(results, null, 2));
  });