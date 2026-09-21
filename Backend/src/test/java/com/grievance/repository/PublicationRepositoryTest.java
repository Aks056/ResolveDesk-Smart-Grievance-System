package com.grievance.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;

import com.grievance.entity.Department;
import com.grievance.entity.Grievance;
import com.grievance.entity.GrievanceHistory;
import com.grievance.entity.User;
import com.grievance.enums.GrievanceStatus;
import com.grievance.enums.HistoryVisibility;
import com.grievance.enums.Role;

@DataJpaTest(showSql = false, properties = {
        "spring.config.location=optional:classpath:/privacy-tests.properties",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.sql.init.mode=never"
})
class PublicationRepositoryTest {
    @Autowired private GrievanceRepository repository;
    @Autowired private TestEntityManager entities;

    @Test
    void publishedQueryExcludesPrivateAndLegacyNullRowsAndVisibilityPersists() {
        Department department = entities.persist(Department.builder().name("Water").build());
        User citizen = entities.persist(User.builder().username("privacy-test").email("privacy@example.test")
                .passwordHash("test-only").firstName("Test").lastName("Citizen").role(Role.USER).build());
        Grievance published = entities.persist(Grievance.builder().grievanceNumber("GRV-PUBLISHED")
                .citizen(citizen).department(department).title("Private raw title").description("Private narrative")
                .published(true).publicId(UUID.randomUUID().toString()).publicTitle("Reviewed").publicSummary("Reviewed summary").build());
        Grievance privateCase = entities.persist(Grievance.builder().grievanceNumber("GRV-PRIVATE")
                .citizen(citizen).department(department).title("Private").description("Private").build());
        entities.persist(Grievance.builder().grievanceNumber("GRV-LEGACY")
                .citizen(citizen).department(department).title("Legacy").description("Legacy").published(null).build());
        GrievanceHistory history = entities.persist(GrievanceHistory.builder().grievance(privateCase)
                .newStatus(GrievanceStatus.PENDING).updatedByUser(citizen).remarks("Internal note").build());
        entities.flush();
        entities.clear();
        var page = repository.findByPublishedTrueOrderByCreatedAtDesc(PageRequest.of(0, 100));
        assertEquals(1, page.getTotalElements());
        assertEquals(published.getPublicId(), page.getContent().get(0).getPublicId());
        assertTrue(repository.findByPublicIdAndPublishedTrue(published.getPublicId()).isPresent());
        assertEquals(HistoryVisibility.INTERNAL, entities.find(GrievanceHistory.class, history.getId()).getVisibility());
        Grievance claim = repository.findByIdForClaim(privateCase.getId()).orElseThrow();
        assertEquals(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE, entities.getEntityManager().getLockMode(claim));
        Grievance withdrawn = repository.findById(published.getId()).orElseThrow();
        withdrawn.setPublished(false);
        entities.flush();
        assertTrue(repository.findByPublicIdAndPublishedTrue(published.getPublicId()).isEmpty());
    }
}