package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.ShippingAreaDTO;
import com.otaku.ecommerce.dto.ShippingRateDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ShippingService {

    @Value("${binderbyte.api-key}")
    private String apiKey;

    @Value("${binderbyte.base-url}")
    private String baseUrl;

    private final org.springframework.web.client.RestTemplate restTemplate;

    public ShippingService() {
        this.restTemplate = new org.springframework.web.client.RestTemplate();
    }

    // {id, kecamatan, kota, provinsi, kode_pos}
    private static final String[][] AREA_DATA = {
            // DKI Jakarta
            { "JKT-UTR-CLN", "Cilincing", "Jakarta Utara", "DKI Jakarta", "14110" },
            { "JKT-UTR-PDM", "Pademangan", "Jakarta Utara", "DKI Jakarta", "14420" },
            { "JKT-UTR-TJP", "Tanjung Priok", "Jakarta Utara", "DKI Jakarta", "14310" },
            { "JKT-PST-GMB", "Gambir", "Jakarta Pusat", "DKI Jakarta", "10110" },
            { "JKT-PST-MTG", "Menteng", "Jakarta Pusat", "DKI Jakarta", "10310" },
            { "JKT-PST-SNN", "Senen", "Jakarta Pusat", "DKI Jakarta", "10410" },
            { "JKT-SLT-KBB", "Kebayoran Baru", "Jakarta Selatan", "DKI Jakarta", "12110" },
            { "JKT-SLT-MGS", "Mampang Prapatan", "Jakarta Selatan", "DKI Jakarta", "12790" },
            { "JKT-SLT-PSM", "Pasar Minggu", "Jakarta Selatan", "DKI Jakarta", "12530" },
            { "JKT-TMR-JTN", "Jatinegara", "Jakarta Timur", "DKI Jakarta", "13110" },
            { "JKT-TMR-PGD", "Pulogadung", "Jakarta Timur", "DKI Jakarta", "13210" },
            { "JKT-TMR-DRE", "Duren Sawit", "Jakarta Timur", "DKI Jakarta", "13440" },
            { "JKT-BRT-CGK", "Cengkareng", "Jakarta Barat", "DKI Jakarta", "11730" },
            { "JKT-BRT-KBJ", "Kebon Jeruk", "Jakarta Barat", "DKI Jakarta", "11530" },
            // Jawa Barat
            { "JBR-BDG-CBL", "Coblong", "Bandung", "Jawa Barat", "40131" },
            { "JBR-BDG-CCN", "Cicendo", "Bandung", "Jawa Barat", "40171" },
            { "JBR-BDG-BGR", "Bandung Kulon", "Bandung", "Jawa Barat", "40212" },
            { "JBR-BKS-TBR", "Tambun Selatan", "Bekasi", "Jawa Barat", "17510" },
            { "JBR-BKS-BTU", "Bekasi Utara", "Bekasi", "Jawa Barat", "17121" },
            { "JBR-BGR-TGH", "Bogor Tengah", "Bogor", "Jawa Barat", "16124" },
            { "JBR-DPK-BKT", "Beji", "Depok", "Jawa Barat", "16421" },
            { "JBR-TGR-LSP", "Larangan", "Tangerang", "Banten", "15154" },
            // Jawa Timur
            { "JTM-SBY-GTG", "Genteng", "Surabaya", "Jawa Timur", "60111" },
            { "JTM-SBY-BBT", "Bubutan", "Surabaya", "Jawa Timur", "60174" },
            { "JTM-SBY-WKR", "Wonokromo", "Surabaya", "Jawa Timur", "60243" },
            { "JTM-MLG-KLJ", "Klojen", "Malang", "Jawa Timur", "65111" },
            { "JTM-SDA-SID", "Sidoarjo", "Sidoarjo", "Jawa Timur", "61218" },
            // Jawa Tengah & DIY
            { "JTG-SRG-TGH", "Semarang Tengah", "Semarang", "Jawa Tengah", "50134" },
            { "JTG-SMG-TBL", "Tembalang", "Semarang", "Jawa Tengah", "50272" },
            { "DIY-YGK-GDK", "Gondokusuman", "Yogyakarta", "DI Yogyakarta", "55166" },
            { "DIY-YGK-KRT", "Kraton", "Yogyakarta", "DI Yogyakarta", "55133" },
            // Sumatera
            { "SMT-MDN-TMR", "Medan Timur", "Medan", "Sumatera Utara", "20235" },
            { "SMT-MDN-BAR", "Medan Baru", "Medan", "Sumatera Utara", "20154" },
            { "SMT-PLB-ITI", "Ilir Timur", "Palembang", "Sumatera Selatan", "30121" },
            { "SMT-PKB-PUS", "Pekanbaru Kota", "Pekanbaru", "Riau", "28156" },
            { "SMT-PDG-PDG", "Padang Selatan", "Padang", "Sumatera Barat", "25211" },
            // Lainnya
            { "BLI-DPS-SLT", "Denpasar Selatan", "Denpasar", "Bali", "80223" },
            { "BLI-DPS-BRT", "Denpasar Barat", "Denpasar", "Bali", "80117" },
            { "KLS-BJM-TGH", "Banjarmasin Tengah", "Banjarmasin", "Kalimantan Selatan", "70111" },
            { "SLS-MKS-UJP", "Ujung Pandang", "Makassar", "Sulawesi Selatan", "90111" },
    };

    // ─── Pencarian Area Kota ──────────────────────────────────────────────────
    public ShippingAreaDTO searchAreas(String query) {
        ShippingAreaDTO result = new ShippingAreaDTO();
        result.setSuccess(true);

        String q = query.toLowerCase();
        List<ShippingAreaDTO.Area> areas = new java.util.ArrayList<>();

        for (String[] d : AREA_DATA) {
            String fullName = d[1] + ", " + d[2] + ", " + d[3] + ". " + d[4];
            if (d[1].toLowerCase().contains(q)
                    || d[2].toLowerCase().contains(q)
                    || d[3].toLowerCase().contains(q)) {
                ShippingAreaDTO.Area a = new ShippingAreaDTO.Area();
                a.setId(d[0]);
                a.setDistrict(d[1]);
                a.setCity(d[2]);
                a.setProvince(d[3]);
                a.setPostalCode(d[4]);
                a.setName(fullName);
                areas.add(a);
            }
        }

        result.setAreas(areas);
        return result;
    }

    // ─── Kalkulasi Tarif Pengiriman ───────────────────────────────────────────
    public ShippingRateDTO getShippingCost(String destinationId, int weightGram, String courierFilter) {
        // Cari detail kota tujuan
        String destinationCity = "";
        for (String[] d : AREA_DATA) {
            if (d[0].equals(destinationId)) {
                // BinderByte format: "Kecamatan, Kota"
                destinationCity = d[1] + "," + d[2];
                break;
            }
        }

        // Jika tidak ketemu, default ke input aslinya
        if (destinationCity.isEmpty())
            destinationCity = destinationId;

        try {
            // Setup request BinderByte
            String url = baseUrl + "/cost";
            double weightKg = (double) weightGram / 1000.0;

            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("api_key", apiKey);
            body.put("origin", "jakarta timur"); // Origin toko
            body.put("destination", destinationCity.toLowerCase());
            body.put("weight", weightKg);
            body.put("courier", (courierFilter == null || courierFilter.isEmpty()) ? "jne,jnt,sicepat,anteraja,pos"
                    : courierFilter);

            com.otaku.ecommerce.dto.ShippingCostResponseDTO apiRes = restTemplate.postForObject(url, body,
                    com.otaku.ecommerce.dto.ShippingCostResponseDTO.class);

            if (apiRes != null && apiRes.getData() != null && apiRes.getData().getResults() != null) {
                ShippingRateDTO result = new ShippingRateDTO();
                result.setSuccess(true);
                List<ShippingRateDTO.CourierOption> options = new java.util.ArrayList<>();

                for (com.otaku.ecommerce.dto.ShippingCostResponseDTO.Result res : apiRes.getData().getResults()) {
                    for (com.otaku.ecommerce.dto.ShippingCostResponseDTO.CostDetail detail : res.getCosts()) {
                        ShippingRateDTO.CourierOption opt = new ShippingRateDTO.CourierOption();
                        opt.setCourierCode(res.getCode());
                        opt.setCourierName(res.getName());
                        opt.setServiceName(detail.getDescription());
                        opt.setServiceCode(detail.getService());
                        opt.setPrice(detail.getCost());
                        opt.setEstimatedDay(detail.getEtd());
                        options.add(opt);
                    }
                }
                result.setCouriers(options);
                return result;
            }
        } catch (Exception e) {
            System.err.println("BinderByte API Error: " + e.getMessage());
            // Fallback ke mock jika API error
        }

        // ─── FALLBACK MOCK (Jika API Gagal atau Tidak Tersedia) ───────────────────
        return getMockShippingCost(destinationId, weightGram, courierFilter);
    }

    private ShippingRateDTO getMockShippingCost(String destinationId, int weightGram, String courierFilter) {
        ShippingRateDTO result = new ShippingRateDTO();
        result.setSuccess(true);

        // Harga dasar berubah tergantung region (Simulasi Jarak)
        long cityMultiplier = 20_000L; // Default
        if (destinationId.startsWith("JKT")) {
            cityMultiplier = 9_000L; // Jakarta
        } else if (destinationId.startsWith("JBR")) {
            cityMultiplier = 12_000L; // Jawa Barat (Bandung, dll)
        } else if (destinationId.startsWith("JTG") || destinationId.startsWith("DIY")) {
            cityMultiplier = 18_000L; // Jawa Tengah & DIY
        } else if (destinationId.startsWith("JTM")) {
            cityMultiplier = 22_000L; // Jawa Timur
        } else if (destinationId.startsWith("BLI")) {
            cityMultiplier = 28_000L; // Bali
        } else if (destinationId.startsWith("SMT")) {
            cityMultiplier = 35_000L; // Sumatera
        } else if (destinationId.startsWith("KLS") || destinationId.startsWith("SLS")) {
            cityMultiplier = 45_000L; // Kalimantan & Sulawesi
        }

        int kg500 = (int) Math.max(1, Math.ceil((double) weightGram / 500));
        long basePrice = kg500 * cityMultiplier;

        Object[][] catalog = {
                { "jne", "JNE", "JNE Reguler", "REG", 1.00, "2-3" },
                { "jne", "JNE", "JNE Oke", "OKE", 0.80, "4-6" },
                { "jne", "JNE", "JNE YES", "YES", 2.20, "1" },
                { "jnt", "J&T Express", "J&T Express", "EZ", 1.05, "2-3" },
                { "sicepat", "SiCepat", "SiCepat BEST", "BEST", 1.00, "2-3" },
                { "pos", "POS Indonesia", "POS Kilat Khusus", "SKH", 0.90, "3-5" },
        };

        String filter = (courierFilter != null) ? courierFilter.toLowerCase().trim() : "";
        List<ShippingRateDTO.CourierOption> options = new java.util.ArrayList<>();

        for (Object[] r : catalog) {
            String code = (String) r[0];
            if (!filter.isBlank() && !filter.contains(code))
                continue;

            ShippingRateDTO.CourierOption opt = new ShippingRateDTO.CourierOption();
            opt.setCourierCode(code);
            opt.setCourierName((String) r[1]);
            opt.setServiceName((String) r[2]);
            opt.setServiceCode((String) r[3]);
            opt.setPrice(Math.round(basePrice * (Double) r[4]));
            opt.setEstimatedDay((String) r[5]);
            options.add(opt);
        }

        result.setCouriers(options);
        return result;
    }

}
