const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Раздаём все статические файлы (css, js, html, png...)
app.use(express.static(path.join(__dirname)));

// Любой неизвестный маршрут → index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});