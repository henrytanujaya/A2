package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.ShippingAreaDTO;
import com.otaku.ecommerce.dto.ShippingRateDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * ShippingService — Sepenuhnya mandiri, tanpa dependensi API eksternal.
 * Berisi data 40 area kota besar Indonesia dan tarif 5 kurir populer.
 * Data tarif dihitung secara dinamis berdasarkan berat paket.
 */
@Service
public class ShippingService {

    // ─── Pencarian Area Kota ──────────────────────────────────────────────────
    public ShippingAreaDTO searchAreas(String query) {
        ShippingAreaDTO result = new ShippingAreaDTO();
        result.setSuccess(true);

        // {id, kecamatan, kota, provinsi, kode_pos}
        String[][] areaData = {
            // DKI Jakarta
            {"JKT-UTR-CLN", "Cilincing",          "Jakarta Utara",   "DKI Jakarta",       "14110"},
            {"JKT-UTR-PDM", "Pademangan",          "Jakarta Utara",   "DKI Jakarta",       "14420"},
            {"JKT-UTR-TJP", "Tanjung Priok",       "Jakarta Utara",   "DKI Jakarta",       "14310"},
            {"JKT-PST-GMB", "Gambir",              "Jakarta Pusat",   "DKI Jakarta",       "10110"},
            {"JKT-PST-MTG", "Menteng",             "Jakarta Pusat",   "DKI Jakarta",       "10310"},
            {"JKT-PST-SNN", "Senen",               "Jakarta Pusat",   "DKI Jakarta",       "10410"},
            {"JKT-SLT-KBB", "Kebayoran Baru",      "Jakarta Selatan", "DKI Jakarta",       "12110"},
            {"JKT-SLT-MGS", "Mampang Prapatan",    "Jakarta Selatan", "DKI Jakarta",       "12790"},
            {"JKT-SLT-PSM", "Pasar Minggu",        "Jakarta Selatan", "DKI Jakarta",       "12530"},
            {"JKT-TMR-JTN", "Jatinegara",          "Jakarta Timur",   "DKI Jakarta",       "13110"},
            {"JKT-TMR-PGD", "Pulogadung",          "Jakarta Timur",   "DKI Jakarta",       "13210"},
            {"JKT-TMR-DRE", "Duren Sawit",         "Jakarta Timur",   "DKI Jakarta",       "13440"},
            {"JKT-BRT-CGK", "Cengkareng",          "Jakarta Barat",   "DKI Jakarta",       "11730"},
            {"JKT-BRT-KBJ", "Kebon Jeruk",         "Jakarta Barat",   "DKI Jakarta",       "11530"},
            // Jawa Barat
            {"JBR-BDG-CBL", "Coblong",             "Bandung",         "Jawa Barat",        "40131"},
            {"JBR-BDG-CCN", "Cicendo",             "Bandung",         "Jawa Barat",        "40171"},
            {"JBR-BDG-BGR", "Bandung Kulon",        "Bandung",         "Jawa Barat",        "40212"},
            {"JBR-BKS-TBR", "Tambun Selatan",      "Bekasi",          "Jawa Barat",        "17510"},
            {"JBR-BKS-BTU", "Bekasi Utara",        "Bekasi",          "Jawa Barat",        "17121"},
            {"JBR-BGR-TGH", "Bogor Tengah",        "Bogor",           "Jawa Barat",        "16124"},
            {"JBR-DPK-BKT", "Beji",                "Depok",           "Jawa Barat",        "16421"},
            {"JBR-TGR-LSP", "Larangan",            "Tangerang",       "Banten",            "15154"},
            // Jawa Timur
            {"JTM-SBY-GTG", "Genteng",             "Surabaya",        "Jawa Timur",        "60111"},
            {"JTM-SBY-BBT", "Bubutan",             "Surabaya",        "Jawa Timur",        "60174"},
            {"JTM-SBY-WKR", "Wonokromo",           "Surabaya",        "Jawa Timur",        "60243"},
            {"JTM-MLG-KLJ", "Klojen",              "Malang",          "Jawa Timur",        "65111"},
            {"JTM-SDA-SID", "Sidoarjo",            "Sidoarjo",        "Jawa Timur",        "61218"},
            // Jawa Tengah & DIY
            {"JTG-SRG-TGH", "Semarang Tengah",     "Semarang",        "Jawa Tengah",       "50134"},
            {"JTG-SMG-TBL", "Tembalang",           "Semarang",        "Jawa Tengah",       "50272"},
            {"DIY-YGK-GDK", "Gondokusuman",        "Yogyakarta",      "DI Yogyakarta",     "55166"},
            {"DIY-YGK-KRT", "Kraton",              "Yogyakarta",      "DI Yogyakarta",     "55133"},
            // Sumatera
            {"SMT-MDN-TMR", "Medan Timur",         "Medan",           "Sumatera Utara",    "20235"},
            {"SMT-MDN-BAR", "Medan Baru",          "Medan",           "Sumatera Utara",    "20154"},
            {"SMT-PLB-ITI", "Ilir Timur",          "Palembang",       "Sumatera Selatan",  "30121"},
            {"SMT-PKB-PUS", "Pekanbaru Kota",      "Pekanbaru",       "Riau",              "28156"},
            {"SMT-PDG-PDG", "Padang Selatan",      "Padang",          "Sumatera Barat",    "25211"},
            // Lainnya
            {"BLI-DPS-SLT", "Denpasar Selatan",    "Denpasar",        "Bali",              "80223"},
            {"BLI-DPS-BRT", "Denpasar Barat",      "Denpasar",        "Bali",              "80117"},
            {"KLS-BJM-TGH", "Banjarmasin Tengah",  "Banjarmasin",     "Kalimantan Selatan","70111"},
            {"SLS-MKS-UJP", "Ujung Pandang",       "Makassar",        "Sulawesi Selatan",  "90111"},
        };

        String q = query.toLowerCase();
        List<ShippingAreaDTO.Area> areas = new ArrayList<>();

        for (String[] d : areaData) {
            String fullName = d[1] + ", " + d[2] + ", " + d[3] + ". " + d[4];
            if (d[1].toLowerCase().contains(q)
                    || d[2].toLowerCase().contains(q)
                    || d[3].toLowerCase().contains(q)) {
                ShippingAreaDTO.Area area = new ShippingAreaDTO.Area();
                area.setId(d[0]);
                area.setName(fullName);
                area.setDistrict(d[1]);
                area.setCity(d[2]);
                area.setProvince(d[3]);
                area.setPostalCode(d[4]);
                areas.add(area);
            }
        }

        result.setAreas(areas);
        return result;
    }

    // ─── Kalkulasi Tarif Pengiriman ───────────────────────────────────────────
    public ShippingRateDTO getShippingCost(String destinationId, int weightGram, String courierFilter) {
        ShippingRateDTO result = new ShippingRateDTO();
        result.setSuccess(true);

        // Harga dasar: Rp 9.000 per 500g (minimum 9.000)
        int kg500 = (int) Math.max(1, Math.ceil((double) weightGram / 500));
        long basePrice = kg500 * 9_000L;

        // {kode, nama, nama_layanan, kode_layanan, multiplier, estimasi_hari}
        Object[][] catalog = {
            {"jne",      "JNE",           "JNE Reguler",        "REG",  1.00, "2-3"},
            {"jne",      "JNE",           "JNE Oke",            "OKE",  0.80, "4-6"},
            {"jne",      "JNE",           "JNE YES",            "YES",  2.20, "1"},
            {"jnt",      "J&T Express",   "J&T Express",        "EZ",   1.05, "2-3"},
            {"jnt",      "J&T Express",   "J&T Economy",        "EX",   0.88, "3-5"},
            {"sicepat",  "SiCepat",       "SiCepat BEST",       "BEST", 1.00, "2-3"},
            {"sicepat",  "SiCepat",       "SiCepat HALU",       "HALU", 2.10, "1"},
            {"anteraja", "AnterAja",      "AnterAja Reguler",   "REG",  1.00, "2-4"},
            {"anteraja", "AnterAja",      "AnterAja Next Day",  "ND",   1.80, "1"},
            {"pos",      "POS Indonesia", "POS Kilat Khusus",   "SKH",  0.90, "3-5"},
            {"pos",      "POS Indonesia", "POS Express Semalam","EXS",  2.00, "1"},
        };

        String filter = (courierFilter != null) ? courierFilter.toLowerCase().trim() : "";
        List<ShippingRateDTO.CourierOption> options = new ArrayList<>();

        for (Object[] r : catalog) {
            String code = (String) r[0];
            if (!filter.isBlank() && !code.equals(filter)) continue;

            ShippingRateDTO.CourierOption opt = new ShippingRateDTO.CourierOption();
            opt.setCourierCode(code);
            opt.setCourierName((String) r[1]);
            opt.setServiceName((String) r[2]);
            opt.setServiceCode((String) r[3]);
            opt.setPrice(Math.round(basePrice * (Double) r[4]));
            opt.setEstimatedDay((String) r[5]);
            options.add(opt);
        }

        // Jika filter tidak cocok dengan kurir manapun, tampilkan semua
        if (options.isEmpty()) {
            for (Object[] r : catalog) {
                ShippingRateDTO.CourierOption opt = new ShippingRateDTO.CourierOption();
                opt.setCourierCode((String) r[0]);
                opt.setCourierName((String) r[1]);
                opt.setServiceName((String) r[2]);
                opt.setServiceCode((String) r[3]);
                opt.setPrice(Math.round(basePrice * (Double) r[4]));
                opt.setEstimatedDay((String) r[5]);
                options.add(opt);
            }
        }

        result.setCouriers(options);
        return result;
    }
}
