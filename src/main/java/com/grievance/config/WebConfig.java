package com.grievance.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import lombok.AllArgsConstructor;

/**
 * Web Configuration for serving static resources (e.g. uploaded files)
 */
@Configuration
@AllArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final FileUploadProperties fileUploadProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadDir = fileUploadProperties.getUpload().getDir();
        
        // Ensure the path ends with a slash and is properly formatted for resource locations
        String resourceLocation = "file:" + uploadDir;
        if (!resourceLocation.endsWith("/")) {
            resourceLocation += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }

    @Override
    public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173", "http://localhost:3000") // Common dev ports
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
