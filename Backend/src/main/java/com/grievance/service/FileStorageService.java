package com.grievance.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.grievance.config.FileUploadProperties;
import com.grievance.exception.BadRequestException;

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

        Path uploadPath = storageRoot();
        String uniqueFilename = UUID.randomUUID().toString() + "." + extension;
        Path filePath = uploadPath.resolve(uniqueFilename);

        try (var input = file.getInputStream()) {
            Files.copy(input, filePath);
        }
        return uniqueFilename;
    }

    private Path storageRoot() throws IOException {
        Path configured = Paths.get(fileUploadProperties.getUpload().getDir()).toAbsolutePath().normalize();
        rejectStaticRoot(configured);
        Files.createDirectories(configured);
        Path root = configured.toRealPath();
        rejectStaticRoot(root);
        return root;
    }

    private void rejectStaticRoot(Path root) {
        for (Path component : root) {
            if (java.util.Set.of("static", "public", "resources", "meta-inf", "webapp")
                    .contains(component.toString().toLowerCase(java.util.Locale.ROOT))) {
                throw new IllegalStateException("Evidence storage must be outside static web roots");
            }
        }
    }

    public org.springframework.core.io.Resource loadEvidence(String storedPath) {
        try {
            if (storedPath == null || storedPath.isBlank() || storedPath.indexOf('\0') >= 0) return missingEvidence();
            Path root = storageRoot();
            String normalized = storedPath.replace('\\', '/');
            Path stored = Paths.get(normalized);
            for (Path component : stored) {
                if (component.toString().equals("..")) return missingEvidence();
            }
            Path candidate;
            if (stored.isAbsolute()) {
                candidate = stored.normalize();
            } else if (stored.getNameCount() == 1) {
                candidate = root.resolve(stored);
            } else {
                String prefix = fileUploadProperties.getUpload().getDir().replace('\\', '/');
                if (!prefix.endsWith("/")) prefix += "/";
                if (normalized.startsWith(prefix)) {
                    candidate = root.resolve(normalized.substring(prefix.length())).normalize();
                } else {
                    candidate = stored.toAbsolutePath().normalize();
                }
            }
            if (!candidate.startsWith(root) || !root.equals(candidate.getParent())) return missingEvidence();
            String filename = candidate.getFileName().toString();
            if (!filename.matches("(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:_[^/\\\\:]+|\\.[a-z0-9]+)")) {
                return missingEvidence();
            }
            Path real = candidate.toRealPath();
            if (!real.startsWith(root) || !Files.isRegularFile(real)) return missingEvidence();
            return new org.springframework.core.io.FileSystemResource(real);
        } catch (IOException | InvalidPathException exception) {
            return missingEvidence();
        }
    }

    private org.springframework.core.io.Resource missingEvidence() {
        throw new com.grievance.exception.ResourceNotFoundException("Evidence is unavailable");
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
            || "application/pdf".equals(contentType)
            || "application/msword".equals(contentType)
            || "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(contentType)
            || "text/plain".equals(contentType);
    }
}
