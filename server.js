const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = 3000;
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xefzaibtbcwiefebxyqf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZnphaWJ0YmN3aWVmZWJ4eXFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDg1MzY5OSwiZXhwIjoyMDQ2NDI5Njk5fQ.EpwpvrIvZJf8eZEWFjN9kCwn0MaKpzCPLbPf7pD86qY';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(bodyParser.json());
app.use(express.static('public'));

// Halaman admin
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Halaman admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Menambah kamar
app.post('/tambah-kamar', async (req, res) => {
    console.log('Request diterima:', req.body);  // Menambahkan log untuk melihat apakah data diterima dengan benar

    const { nama, kamarId } = req.body;

    if (!nama || !kamarId) {
        return res.status(400).json({ error: 'Semua data harus diisi.' });
    }

    try {
        // Menambah kamar baru di tabel catatan
        const { data, error } = await supabase
            .from('catatan')
            .insert([{ nama, kamarId, kwhBulanIni: null, kwhBulanLalu: null, totalBiaya: 0 }]);

        if (error) throw error;

        res.json({ message: 'Kamar berhasil ditambahkan', data });
    } catch (err) {
        console.error('Terjadi kesalahan:', err);  // Menambahkan log error
        res.status(500).json({ error: err.message });
    }
});


// Update berdasarkan kamarId
app.post('/update-kwh', async (req, res) => {
    const { kamarId, kwhBulanIni, kwhBulanLalu } = req.body;

    if (kwhBulanIni === undefined || kwhBulanLalu === undefined || !kamarId) {
        return res.status(400).json({ error: 'Data KWh dan Kamar ID harus diisi.' });
    }

    const pemakaian = kwhBulanIni - kwhBulanLalu;
    const biayaAir = 30;
    const totalBiaya = pemakaian * 3 + biayaAir;

    try {
        const { data, error } = await supabase
            .from('catatan')
            .update({ kwhBulanIni, kwhBulanLalu, totalBiaya })
            .eq('kamarId', kamarId);

        if (error) throw error;

        res.json({ message: 'KWh berhasil diperbarui', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Menghapus catatan
app.delete('/hapus-catatan/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('catatan')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Catatan berhasil dihapus', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mendapatkan semua catatan (untuk menampilkan daftar kamar)
app.get('/kamar', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('catatan')
            .select('*');

        if (error) throw error;

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
