const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = 3000;

// Setup database
const db = new sqlite3.Database(':memory:'); // Menggunakan database in-memory
db.serialize(() => {
    db.run("CREATE TABLE kamar (id INTEGER PRIMARY KEY, nama TEXT, nomorKamar TEXT)");
    db.run("CREATE TABLE catatan (id INTEGER PRIMARY KEY, kamarId INTEGER, kwhBulanIni INTEGER, kwhBulanLalu INTEGER, totalBiaya INTEGER, FOREIGN KEY(kamarId) REFERENCES kamar(id))");
});

app.use(bodyParser.json());
app.use(express.static('public'));

// Rute untuk halaman admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Rute untuk halaman utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rute untuk menambah kamar
app.post('/tambah-kamar', (req, res) => {
    const { nama, nomorKamar } = req.body;
    db.run("INSERT INTO kamar (nama, nomorKamar) VALUES (?, ?)", [nama, nomorKamar], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Kamar berhasil ditambahkan" });
    });
});

app.post('/update-kwh', (req, res) => {
    const { id, kwhBulanIni, kwhBulanLalu } = req.body;

    const pemakaian = kwhBulanIni - kwhBulanLalu;
    const biayaAir = 30; // Biaya air 30
    const totalBiaya = pemakaian * 3 + biayaAir;

    // Cek apakah ada catatan untuk kamarId ini
    db.get("SELECT * FROM catatan WHERE kamarId = ?", [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (row) {
            // Jika sudah ada, perbarui catatan
            db.run("UPDATE catatan SET kwhBulanIni = ?, kwhBulanLalu = ?, totalBiaya = ? WHERE kamarId = ?",
                [kwhBulanIni, kwhBulanLalu, totalBiaya, id], function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: "Data berhasil diperbarui", totalBiaya, biayaAir });
                });
        } else {
            // Jika belum ada, buat catatan baru
            db.run("INSERT INTO catatan (kamarId, kwhBulanIni, kwhBulanLalu, totalBiaya) VALUES (?, ?, ?, ?)",
                [id, kwhBulanIni, kwhBulanLalu, totalBiaya], function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: "Data berhasil ditambahkan", totalBiaya, biayaAir });
                });
        }
    });
});




// Rute untuk menghapus pemilik kamar
app.delete('/hapus-kamar/:id', (req, res) => {
    const { id } = req.params;
    console.log(`Menerima permintaan untuk menghapus kamar dengan ID: ${id}`);

    db.run("DELETE FROM kamar WHERE id = ?", id, function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Kamar berhasil dihapus" });
    });
});


// Endpoint untuk mendapatkan data kamar
app.get('/kamar', (req, res) => {
    db.all("SELECT * FROM kamar", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Endpoint untuk mendapatkan catatan
app.get('/catatan', (req, res) => {
    db.all("SELECT catatan.*, kamar.nama, kamar.nomorKamar FROM catatan JOIN kamar ON catatan.kamarId = kamar.id", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
