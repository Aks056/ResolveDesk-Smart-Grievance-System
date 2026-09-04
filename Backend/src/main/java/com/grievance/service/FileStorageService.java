package com.grievance.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.grievance.config.FileUploadProperties;
import com.grievance.exception.BadRequestException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@AllArgsConstructor
public class FileStorageService {

    private final FileUploadProperties fileUploadProperties;

    public String storeFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // Validate file size
        if (file.getSize() > fileUploadProperties.getUpload().getMaxFileSizeBytes()) {
            throw new BadRequestException("File size exceeds the maximum allowed size of " + (fileUploadProperties.getUpload().getMaxFileSizeBytes() / 1_048_576) + "MB");
        }

        // Validate file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new BadRequestException("File name is null");
        }

        String extension = getFileExtension(originalFilename);
        if (!isAllowedExtension(extension)) {
            throw new BadRequestException("File type not allowed: " + extension);
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !isAllowedContentType(contentType)) {
            throw new BadRequestException("File content type not allowed: " + contentType);
        }

        // Create upload directory if it does not exist
        String uploadDir = fileUploadProperties.getUpload().getDir();
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String uniqueFilename = UUID.randomUUID().toString() + "_" + originalFilename;
        Path filePath = uploadPath.resolve(uniqueFilename);

        // Save file
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        log.info("File saved: {}", filePath.toString());

        // Return relative path for storage in database
        return uploadDir + uniqueFilename;
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1).toLowerCase();
    }

    private boolean isAllowedExtension(String extension) {
        String allowedExtensions = fileUploadProperties.getAllowed().getFile().getExtensions();
        String[] allowed = allowedExtensions.split(",");
        for (String ext : allowed) {
            if (ext.trim().equalsIgnoreCase(extension)) {
                return true;
            }
        }
        return false;
    }

    private boolean isAllowedContentType(String contentType) {
        return "image/jpeg".equals(contentType)
            || "image/png".equals(contentType)
            || "application/pdf".equals(contentType);
    }
}
