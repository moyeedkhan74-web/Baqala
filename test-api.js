const https = require('https');

https.get('https://baqala.onrender.com/api/apps?featured=true', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
