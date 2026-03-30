package com.grievance.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Data
@Configuration
@ConfigurationProperties(prefix = "app")
public class FileUploadProperties {

    private Upload upload = new Upload();
    private Allowed allowed = new Allowed();

    @Data
    public static class Upload {
        private String dir = "uploads/";
    }

    @Data
    public static class Allowed {
        private File file = new File();

        @Data
        public static class File {
            private String extensions = "pdf,doc,docx,jpg,jpeg,png,txt";
        }
    }
}
