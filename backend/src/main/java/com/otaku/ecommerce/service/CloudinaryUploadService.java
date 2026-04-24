package com.otaku.ecommerce.service;

import com.otaku.ecommerce.exception.CustomBusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class CloudinaryUploadService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryUploadService.class);

    private static final List<String> ALLOWED_MIME = List.of("image/png", "image/jpeg");
    private static final long MAX_BYTES = 10L * 1024 * 1024; // 10 MB

    @Value("${storage.outfit-dir}") private String outfitDir;
    @Value("${storage.figure-dir}") private String figureDir;

    public String uploadOutfitReference(MultipartFile file) throws IOException {
        validateFile(file);
        return saveFileLocally(file, outfitDir, "outfit");
    }

    public String uploadFigureReference(MultipartFile file) throws IOException {
        validateFile(file);
        return saveFileLocally(file, figureDir, "figure");
    }

    private String saveFileLocally(MultipartFile file, String directory, String prefix) throws IOException {
        Path uploadPath = Paths.get(directory);
        
        // Buat folder jika belum ada
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate nama file unik
        String extension = getFileExtension(file.getOriginalFilename());
        String fileName = prefix + "_" + UUID.randomUUID().toString() + extension;
        Path targetLocation = uploadPath.resolve(fileName);

        // Simpan file
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        
        log.info("[STORAGE-OK] File saved locally at: {}", targetLocation.toString());

        // Kembalikan URL yang bisa diakses (localhost:8321/uploads/...)
        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/")
                .path(directory)
                .path("/")
                .path(fileName)
                .toUriString();
                
        return fileDownloadUri;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new CustomBusinessException("OTK-4101", "File tidak boleh kosong.", 400);

        if (file.getContentType() == null || !ALLOWED_MIME.contains(file.getContentType()))
            throw new CustomBusinessException("OTK-4099", "Hanya PNG/JPG yang diizinkan.", 400);

        if (file.getSize() > MAX_BYTES)
            throw new CustomBusinessException("OTK-4100", "File terlalu besar (Maks 10MB).", 400);
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return ".jpg";
        return fileName.substring(fileName.lastIndexOf("."));
    }
}
