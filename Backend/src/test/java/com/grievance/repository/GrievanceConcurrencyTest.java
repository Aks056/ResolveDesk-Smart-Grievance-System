package com.grievance.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import java.util.function.Consumer;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.grievance.entity.Department;
import com.grievance.entity.Grievance;
import com.grievance.entity.User;
import com.grievance.enums.GrievanceStatus;
import com.grievance.enums.Priority;
import com.grievance.enums.Role;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.OptimisticLockException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.RollbackException;

@DataJpaTest(showSql = false, properties = {
        "spring.config.location=optional:classpath:/privacy-tests.properties",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.sql.init.mode=never"
})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class GrievanceConcurrencyTest {
    @Autowired private GrievanceRepository repository;
    @Autowired private EntityManagerFactory entityManagerFactory;
    @Autowired private PlatformTransactionManager transactionManager;
    @PersistenceContext private EntityManager entities;

    private TransactionTemplate transactions;
    private Long grievanceId;
    private Long officerId;
    private String publicId;

    @BeforeEach
    void createCommittedCase() {
        transactions = new TransactionTemplate(transactionManager);
        transactions.executeWithoutResult(transaction -> {
            String suffix = UUID.randomUUID().toString();
            Department department = Department.builder().name("Water-" + suffix).build();
            entities.persist(department);
            User citizen = User.builder().username("citizen-" + suffix).email("citizen-" + suffix + "@example.test")
                    .passwordHash("test-only").firstName("Test").lastName("Citizen").role(Role.USER).build();
            entities.persist(citizen);
            User officer = User.builder().username("officer-" + suffix).email("officer-" + suffix + "@example.test")
                    .passwordHash("test-only").firstName("Test").lastName("Officer").role(Role.OFFICER)
                    .department(department).build();
            entities.persist(officer);
            officerId = officer.getId();
            publicId = suffix;
            Grievance grievance = Grievance.builder().grievanceNumber("GRV-" + suffix.substring(0, 8))
                    .citizen(citizen).department(department).title("Private title").description("Private narrative")
                    .published(true).publicId(publicId).publicTitle("Reviewed").publicSummary("Reviewed summary").build();
            assertThat(grievance.getVersion()).isZero();
            assertThat(new Grievance().getVersion()).isZero();
            entities.persist(grievance);
            grievanceId = grievance.getId();
        });
    }

    @AfterEach
    void removeCommittedCase() {
        transactions.executeWithoutResult(transaction -> {
            Grievance grievance = repository.findById(grievanceId).orElseThrow();
                Long citizenId = grievance.getCitizen().getId();
                Long departmentId = grievance.getDepartment().getId();
                entities.createQuery("delete from Grievance where id = :id")
                    .setParameter("id", grievanceId).executeUpdate();
                entities.createQuery("delete from User where id = :citizenId or id = :officerId")
                    .setParameter("citizenId", citizenId).setParameter("officerId", officerId).executeUpdate();
                entities.createQuery("delete from Department where id = :id")
                    .setParameter("id", departmentId).executeUpdate();
                entities.clear();
        });
    }

    @Test
    void withdrawalSurvivesStaleStatusCommit() {
        assertWithdrawalSurvives(grievance -> grievance.setStatus(GrievanceStatus.IN_PROGRESS));
    }

    @Test
    void withdrawalSurvivesStalePriorityCommit() {
        assertWithdrawalSurvives(grievance -> grievance.setPriority(Priority.HIGH));
    }

    private void assertWithdrawalSurvives(Consumer<Grievance> staleMutation) {
        rejectStaleCommit(staleMutation, () -> transactions.executeWithoutResult(transaction ->
                repository.findById(grievanceId).orElseThrow().setPublished(false)));
        transactions.executeWithoutResult(transaction -> {
            Grievance stored = repository.findById(grievanceId).orElseThrow();
            assertThat(stored.getVersion()).isEqualTo(1L);
            assertThat(stored.getPublished()).isFalse();
            assertThat(stored.getStatus()).isEqualTo(GrievanceStatus.PENDING);
            assertThat(stored.getPriority()).isEqualTo(Priority.MEDIUM);
            assertThat(repository.findByPublicIdAndPublishedTrue(publicId)).isEmpty();
        });
    }

    @Test
    void claimSurvivesStalePublicationCommit() {
        rejectStaleCommit(grievance -> {
            assertThat(grievance.getAssignedOfficer()).isNull();
            grievance.setPublished(false);
            grievance.setPublicSummary("Stale publication edit");
        }, () -> transactions.executeWithoutResult(transaction -> {
            Grievance claimed = repository.findByIdForClaim(grievanceId).orElseThrow();
            claimed.setAssignedOfficer(entities.getReference(User.class, officerId));
            claimed.setStatus(GrievanceStatus.IN_PROGRESS);
        }));
        transactions.executeWithoutResult(transaction -> {
            Grievance stored = repository.findById(grievanceId).orElseThrow();
            assertThat(stored.getVersion()).isEqualTo(1L);
            assertThat(stored.getAssignedOfficer().getId()).isEqualTo(officerId);
            assertThat(stored.getStatus()).isEqualTo(GrievanceStatus.IN_PROGRESS);
            assertThat(stored.getPublished()).isTrue();
            assertThat(stored.getPublicSummary()).isEqualTo("Reviewed summary");
        });
    }

    private void rejectStaleCommit(Consumer<Grievance> staleMutation, Runnable winningTransaction) {
        EntityManager staleEntities = entityManagerFactory.createEntityManager();
        try {
            staleEntities.getTransaction().begin();
            Grievance stale = staleEntities.find(Grievance.class, grievanceId);
            assertThat(stale.getVersion()).isZero();
            staleMutation.accept(stale);
            winningTransaction.run();
            assertThatThrownBy(() -> staleEntities.getTransaction().commit())
                    .isInstanceOf(RollbackException.class)
                    .hasCauseInstanceOf(OptimisticLockException.class);
        } finally {
            if (staleEntities.getTransaction().isActive()) {
                staleEntities.getTransaction().rollback();
            }
            staleEntities.close();
        }
    }
}