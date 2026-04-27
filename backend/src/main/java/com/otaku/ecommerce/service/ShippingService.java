package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.ShippingAreaDTO;
import com.otaku.ecommerce.dto.ShippingRateDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ShippingService {

    @Value("${binderbyte.api-key}")
    private String apiKey;

    @Value("${binderbyte.base-url}")
    private String baseUrl;

    @Value("${binderbyte.origin}")
    private String origin;

    private final RestTemplate restTemplate;

    public ShippingService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

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
    @SuppressWarnings("unchecked")
    public ShippingRateDTO getShippingCost(String destination, int weightGram, String courierFilter) {
        ShippingRateDTO result = new ShippingRateDTO();
        
        try {
            // 1. Resolusi ID ke Nama Kota
            String targetDestination = destination;
            if (destination.contains("-")) { 
                ShippingAreaDTO areaSearch = searchAreas(""); 
                for (ShippingAreaDTO.Area a : areaSearch.getAreas()) {
                    if (a.getId().equalsIgnoreCase(destination)) {
                        targetDestination = a.getCity(); 
                        break;
                    }
                }
            }

            // 2. Persiapkan Parameter & Headers (Binderbyte V1 Cost preferred format)
            String couriers = (courierFilter != null && !courierFilter.isBlank()) 
                    ? courierFilter.toLowerCase() 
                    : "jne,sicepat,jnt";

            // Normalisasi Nama Kota untuk Binderbyte (menghilangkan 'KOTA ADM.' jika ada)
            String originName = origin.toLowerCase().replace("kota adm. ", "").replace("kab. ", "").trim();
            String destName = targetDestination.toLowerCase().replace("kota adm. ", "").replace("kab. ", "").trim();

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);

            org.springframework.util.MultiValueMap<String, String> map = new org.springframework.util.LinkedMultiValueMap<>();
            map.add("api_key", apiKey);
            map.add("origin", originName);
            map.add("destination", destName);
            map.add("weight", String.valueOf(weightGram));
            map.add("courier", couriers);

            org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, String>> entity = new org.springframework.http.HttpEntity<>(map, headers);

            // 3. Panggil API Binderbyte
            String url = baseUrl + "/cost";
            System.out.println("[SHIPPING-DEBUG] Requesting Binderbyte: " + url + " with map: " + map);
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            System.out.println("[SHIPPING-DEBUG] Binderbyte Response: " + response);
            
            // 4. Proses Respons
            if (response != null && ("200".equals(String.valueOf(response.get("code"))) || "200".equals(String.valueOf(response.get("status"))))) {
                Object dataObj = response.get("data");
                if (dataObj instanceof Map) {
                    Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                    List<Map<String, Object>> costs = (List<Map<String, Object>>) dataMap.get("costs");
                    
                    List<ShippingRateDTO.CourierOption> options = new ArrayList<>();
                    if (costs != null) {
                        for (Map<String, Object> cost : costs) {
                            ShippingRateDTO.CourierOption opt = new ShippingRateDTO.CourierOption();
                            opt.setCourierCode(String.valueOf(cost.get("courier")).toLowerCase());
                            opt.setCourierName(String.valueOf(cost.get("courier")));
                            opt.setServiceName(String.valueOf(cost.get("service")));
                            opt.setServiceCode(String.valueOf(cost.get("service")));
                            opt.setPrice(Long.parseLong(String.valueOf(cost.get("cost"))));
                            opt.setEstimatedDay(String.valueOf(cost.get("etd")));
                            options.add(opt);
                        }
                    }
                    result.setSuccess(true);
                    result.setCouriers(options);
                } else {
                    throw new RuntimeException("Binderbyte data format error");
                }
            } else {
                throw new RuntimeException("Binderbyte API returned " + (response != null ? response.get("code") : "null"));
            }
        } catch (Exception e) {
            System.err.println("[SHIPPING-ERROR] API Call Failed: " + e.getMessage());
            
            // FALLBACK MODE: Jika API gagal (Error 400, Timeout, dll),
            // tetap berikan tarif simulasi agar user tidak stuck di checkout.
            List<ShippingRateDTO.CourierOption> mockOptions = new ArrayList<>();
            
            ShippingRateDTO.CourierOption mockJne = new ShippingRateDTO.CourierOption();
            mockJne.setCourierCode("jne");
            mockJne.setCourierName("JNE (Simulated)");
            mockJne.setServiceCode("REG");
            mockJne.setServiceName("Reguler");
            mockJne.setPrice(15000L);
            mockJne.setEstimatedDay("2-3");
            mockOptions.add(mockJne);

            ShippingRateDTO.CourierOption mockSicepat = new ShippingRateDTO.CourierOption();
            mockSicepat.setCourierCode("sicepat");
            mockSicepat.setCourierName("SiCepat (Simulated)");
            mockSicepat.setServiceCode("REG");
            mockSicepat.setServiceName("Reguler");
            mockSicepat.setPrice(12000L);
            mockSicepat.setEstimatedDay("1-2");
            mockOptions.add(mockSicepat);

            result.setSuccess(true);
            result.setCouriers(mockOptions);
            result.setMessage("Using simulated rates (API error: " + e.getMessage() + ")");
        }
        
        return result;
    }
}
