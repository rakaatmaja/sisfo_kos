const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = 3000;
const { createClient } = require('@supabase/supabase-js')


const supabaseUrl = 'https://xefzaibtbcwiefebxyqf.supabase.co'
const supabaseKey =  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZnphaWJ0YmN3aWVmZWJ4eXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NTM2OTksImV4cCI6MjA0NjQyOTY5OX0.CDrvrYUU-lNa_5Zk4p-EeglvqJ9RO-lHiZGGtLDXN4c'
const supabase = createClient(supabaseUrl, supabaseKey);


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
app.post('/tambah-kamar', async (req, res) => {
    const { nama, nomorKamar } = req.body;
    console.log(req.body);
    // Menambahkan kamar ke Supabase
    const { data, error } = await supabase
        .from('kamar')
        .insert([{ nama, nomorKamar }]);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Kamar berhasil ditambahkan", data });
});


app.post('/update-kwh', async (req, res) => {
    const { id, kwhBulanIni, kwhBulanLalu } = req.body;
    const pemakaian = kwhBulanIni - kwhBulanLalu;
    const biayaAir = 30; // Biaya air 30
    const totalBiaya = pemakaian * 3 + biayaAir;

    // Cek apakah catatan sudah ada untuk kamar ini
    const { data: existingCatatan, error: fetchError } = await supabase
        .from('catatan')
        .select('*')
        .eq('kamarId', id)
        .single(); // Mengambil 1 data saja

    if (fetchError) {
        return res.status(500).json({ error: fetchError.message });
    }

    if (existingCatatan) {
        // Jika ada, perbarui catatan
        const { data, error } = await supabase
            .from('catatan')
            .update({
                kwhBulanIni,
                kwhBulanLalu,
                totalBiaya
            })
            .eq('kamarId', id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: "Data berhasil diperbarui", totalBiaya, biayaAir });
    } else {
        // Jika belum ada, buat catatan baru
        const { data, error } = await supabase
            .from('catatan')
            .insert([{ kamarId: id, kwhBulanIni, kwhBulanLalu, totalBiaya }]);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: "Data berhasil ditambahkan", totalBiaya, biayaAir });
    }
});


// Rute untuk menghapus pemilik kamar
app.delete('/hapus-kamar/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Menerima permintaan untuk menghapus kamar dengan ID: ${id}`);

    const { data, error } = await supabase
        .from('kamar')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Kamar berhasil dihapus", data });
});


// Endpoint untuk mendapatkan data kamar
app.get('/kamar', async (req, res) => {
    const { data, error } = await supabase
        .from('kamar')
        .select('*');

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    res.json(data);
});


// Endpoint untuk mendapatkan catatan
app.get('/catatan', async (req, res) => {
    try {
        const query = `
            SELECT catatan.*, kamar.nama, kamar.nomorKamar
            FROM catatan
            INNER JOIN kamar ON catatan.kamarId = kamar.id;
        `;
        const { data, error } = await supabase.rpc('execute_sql', { sql: query });
        if (error) throw error;

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
