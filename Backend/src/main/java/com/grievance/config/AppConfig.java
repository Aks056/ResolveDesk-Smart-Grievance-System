package com.grievance.config;

import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.grievance.dto.response.GrievanceResponse;
import com.grievance.entity.Grievance;

@Configuration
public class AppConfig {

    @Bean
public ModelMapper modelMapper() {
    ModelMapper modelMapper = new ModelMapper();

    // STRICT mode prevents auto confusion
    modelMapper.getConfiguration()
            .setMatchingStrategy(MatchingStrategies.STRICT);

    // Manual mapping (THIS FIXES YOUR ERROR)
    modelMapper.typeMap(Grievance.class, GrievanceResponse.class)
            .addMappings(mapper -> {
                mapper.map(src -> src.getCitizen().getFullName(),
                        GrievanceResponse::setCitizenName);

                mapper.map(src -> src.getAssignedOfficer().getFullName(),
                        GrievanceResponse::setAssignedOfficerName);
            });

    return modelMapper;
}
}