package com.grievance.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import com.grievance.config.FileUploadProperties;
import com.grievance.exception.ResourceNotFoundException;

class FileStoragePrivacyTest {
    @TempDir Path directory;
    private FileStorageService storage;
    private FileUploadProperties properties;

    @BeforeEach
    void setup() {
        properties = new FileUploadProperties();
        properties.getUpload().setDir(directory.toString());
        storage = new FileStorageService(properties);
    }

    @Test
    void newKeysAreOpaqueAndCanBeDownloaded() throws Exception {
        String key = storage.storeFile(new MockMultipartFile("file", "citizen-sensitive-name.txt", "text/plain", "evidence".getBytes()));
        assertTrue(key.matches("[0-9a-f-]{36}\\.txt"));
        assertFalse(key.contains("citizen"));
        assertEquals("evidence", new String(storage.loadEvidence(key).getContentAsByteArray()));
    }

    @Test
    void legacyKeysAndStoredAbsolutePathsRemainReadable() throws Exception {
        String key = UUID.randomUUID() + "_legacy name.txt";
        Path file = Files.writeString(directory.resolve(key), "legacy");
        assertEquals("legacy", new String(storage.loadEvidence(key).getContentAsByteArray()));
        assertEquals("legacy", new String(storage.loadEvidence(file.toString()).getContentAsByteArray()));
    }

    @Test
    void traversalOutsideAbsolutePathsAndNestedKeysAreDenied() throws Exception {
        String key = UUID.randomUUID() + "_legacy.txt";
        Files.writeString(directory.resolve(key), "data");
        assertThrows(ResourceNotFoundException.class, () -> storage.loadEvidence("../" + key));
        assertThrows(ResourceNotFoundException.class, () -> storage.loadEvidence("..\\" + key));
        assertThrows(ResourceNotFoundException.class, () -> storage.loadEvidence(directory.getParent().resolve(key).toString()));
        assertThrows(ResourceNotFoundException.class, () -> storage.loadEvidence("nested/" + key));
        assertThrows(ResourceNotFoundException.class, () -> storage.loadEvidence("not-an-attachment.txt"));
    }

    @Test
    void staticRootsAreRejected() {
        properties.getUpload().setDir(directory.resolve("static/uploads").toString());
        assertThrows(IllegalStateException.class, () -> storage.storeFile(new MockMultipartFile("file", "safe.txt", "text/plain", new byte[] {1})));
    }

    @Test
    void symlinkEscapeIsDeniedWhenPlatformSupportsSymlinks() throws Exception {
        Path root = Files.createDirectory(directory.resolve("evidence"));
        properties.getUpload().setDir(root.toString());
        Path outside = Files.writeString(directory.resolve("outside.txt"), "private");
        String key = UUID.randomUUID() + ".txt";
        try {
            Files.createSymbolicLink(root.resolve(key), outside);
        } catch (java.io.IOException | UnsupportedOperationException | SecurityException exception) {
            org.junit.jupiter.api.Assumptions.abort("Symbolic links unavailable on this platform");
        }
        assertThrows(ResourceNotFoundException.class, () -> storage.loadEvidence(key));
    }
}