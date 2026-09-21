package com.grievance.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PublicationRequest(@NotNull Boolean published, @Size(max = 200) String publicTitle,
        @Size(max = 2000) String publicSummary) {
}