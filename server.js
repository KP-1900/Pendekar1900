const express = require('express');
const path = require('path');
const app = express();

// Mengarahkan server untuk membaca file di dalam folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Menyalakan server di port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server PENDEKAR siap dan menyala di http://localhost:${PORT}`);
});