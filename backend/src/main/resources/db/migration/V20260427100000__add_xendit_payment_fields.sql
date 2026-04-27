-- Tambah kolom untuk integrasi Xendit
ALTER TABLE Orders ADD payment_invoice_id NVARCHAR(255);
ALTER TABLE Orders ADD payment_status NVARCHAR(50) DEFAULT 'UNPAID';
ALTER TABLE Orders ADD payment_url NVARCHAR(1000);
