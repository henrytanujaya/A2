package com.otaku.ecommerce.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.otaku.ecommerce.exception.CustomBusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class CloudinaryUploadService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryUploadService.class);

    private static final List<String> ALLOWED_MIME = List.of("image/png", "image/jpeg", "image/webp");
    private static final long MAX_BYTES = 10L * 1024 * 1024; // 10 MB

    @Autowired
    private Cloudinary cloudinary;

    public String uploadOutfitReference(MultipartFile file) throws IOException {
        return uploadToCloudinary(file, "otaku/apparel-designs");
    }

    public String uploadFigureReference(MultipartFile file) throws IOException {
        return uploadToCloudinary(file, "otaku/3d-models");
    }

    @SuppressWarnings("unchecked")
    private String uploadToCloudinary(MultipartFile file, String folder) throws IOException {
        validateFile(file);
        
        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", folder,
                "resource_type", "auto"
            ));
            
            String url = (String) uploadResult.get("secure_url");
            log.info("[CLOUDINARY-OK] File uploaded to: {}", url);
            return url;
        } catch (Exception e) {
            log.error("[CLOUDINARY-ERR] Upload failed: {}", e.getMessage());
            throw new CustomBusinessException("OTK-500", "Gagal mengunggah gambar ke cloud: " + e.getMessage(), 500);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new CustomBusinessException("OTK-4101", "File tidak boleh kosong.", 400);

        if (file.getContentType() == null || !ALLOWED_MIME.contains(file.getContentType()))
            throw new CustomBusinessException("OTK-4099", "Hanya PNG/JPG/WEBP yang diizinkan.", 400);

        if (file.getSize() > MAX_BYTES)
            throw new CustomBusinessException("OTK-4100", "File terlalu besar (Maks 10MB).", 400);
    }
}
