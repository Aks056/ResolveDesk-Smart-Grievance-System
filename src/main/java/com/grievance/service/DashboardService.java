package com.grievance.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.grievance.dto.response.DashboardResponse;
import com.grievance.entity.Department;
import com.grievance.entity.Grievance;
import com.grievance.entity.User;
import com.grievance.enums.GrievanceStatus;
import com.grievance.exception.ResourceNotFoundException;
import com.grievance.repository.DepartmentRepository;
import com.grievance.repository.FeedbackRepository;
import com.grievance.repository.GrievanceRepository;
import com.grievance.repository.UserRepository;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@AllArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private GrievanceRepository grievanceRepository;
    private UserRepository userRepository;
    private DepartmentRepository departmentRepository;
    private FeedbackRepository feedbackRepository;

    public DashboardResponse getUserDashboard(Long userId) {
        log.debug("Generating user dashboard for ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<Grievance> userGrievances = grievanceRepository.findByCitizen(user);

        long pendingCount = userGrievances.stream()
                .filter(g -> g.getStatus() == GrievanceStatus.PENDING)
                .count();

        long inProgressCount = userGrievances.stream()
                .filter(g -> g.getStatus() == GrievanceStatus.IN_PROGRESS)
                .count();

        long resolvedCount = userGrievances.stream()
                .filter(g -> g.getStatus() == GrievanceStatus.RESOLVED)
                .count();

        long rejectedCount = userGrievances.stream()
                .filter(g -> g.getStatus() == GrievanceStatus.REJECTED)
                .count();

        long assignedCount = userGrievances.stream()
                .filter(g -> g.getStatus() == GrievanceStatus.ASSIGNED)
                .count();

        long closedCount = userGrievances.stream()
                .filter(g -> g.getStatus() == GrievanceStatus.CLOSED_BY_USER)
                .count();

        Double avgRating = feedbackRepository.getAverageRatingByDepartment(null);

        return DashboardResponse.builder()
                .totalGrievances(userGrievances.size())
                .pendingGrievances(pendingCount)
                .assignedGrievances(assignedCount)
                .inProgressGrievances(inProgressCount)
                .resolvedGrievances(resolvedCount)
                .rejectedGrievances(rejectedCount)
                .closedByUserGrievances(closedCount)
                .myGrievances(userGrievances.size())
                .myAverageRating(avgRating != null ? avgRating : 0.0)
                .build();
    }

    public DashboardResponse getOfficerDashboard(Long officerId) {
        log.debug("Generating officer dashboard for ID: {}", officerId);

        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", officerId));

        List<Grievance> assignedGrievances = grievanceRepository.findByAssignedOfficer(officer);

        long assignedCount = assignedGrievances.size();
        long resolvedByMe = assignedGrievances.stream()
                .filter(g -> g.getStatus() == GrievanceStatus.RESOLVED)
                .count();

        long pendingCount = grievanceRepository.countByStatus(GrievanceStatus.PENDING);
        long assignedStatusCount = grievanceRepository.countByStatus(GrievanceStatus.ASSIGNED);
        long inProgressCount = grievanceRepository.countByStatus(GrievanceStatus.IN_PROGRESS);
        long resolvedCount = grievanceRepository.countByStatus(GrievanceStatus.RESOLVED);
        long rejectedCount = grievanceRepository.countByStatus(GrievanceStatus.REJECTED);
        long closedCount = grievanceRepository.countByStatus(GrievanceStatus.CLOSED_BY_USER);

        return DashboardResponse.builder()
                .totalGrievances(grievanceRepository.count())
                .assignedToMe(assignedCount)
                .resolvedByMe(resolvedByMe)
                .pendingGrievances(pendingCount)
                .assignedGrievances(assignedStatusCount)
                .inProgressGrievances(inProgressCount)
                .resolvedGrievances(resolvedCount)
                .rejectedGrievances(rejectedCount)
                .closedByUserGrievances(closedCount)
                .build();
    }

    public DashboardResponse getAdminDashboard() {
        log.debug("Generating admin dashboard");

        long totalGrievances = grievanceRepository.count();
        long totalUsers = userRepository.count();
        long totalDepartments = departmentRepository.count();

        long pendingCount = grievanceRepository.countByStatus(GrievanceStatus.PENDING);
        long assignedStatusCount = grievanceRepository.countByStatus(GrievanceStatus.ASSIGNED);
        long inProgressCount = grievanceRepository.countByStatus(GrievanceStatus.IN_PROGRESS);
        long resolvedCount = grievanceRepository.countByStatus(GrievanceStatus.RESOLVED);
        long rejectedCount = grievanceRepository.countByStatus(GrievanceStatus.REJECTED);
        long closedByUserCount = grievanceRepository.countByStatus(GrievanceStatus.CLOSED_BY_USER);

        Map<String, DashboardResponse.DepartmentStats> deptStats = getDepartmentStatistics();
        Map<String, Long> dailyTrends = calculateDailyTrends();
        Map<String, Long> weeklyTrends = calculateWeeklyTrends();
        Map<String, Long> monthlyTrends = calculateMonthlyTrends();

        return DashboardResponse.builder()
                .totalGrievances(totalGrievances)
                .totalUsers(totalUsers)
                .totalDepartments(totalDepartments)
                .pendingGrievances(pendingCount)
                .assignedGrievances(assignedStatusCount)
                .inProgressGrievances(inProgressCount)
                .resolvedGrievances(resolvedCount)
                .rejectedGrievances(rejectedCount)
                .closedByUserGrievances(closedByUserCount)
                .departmentStats(deptStats)
                .dailyTrends(dailyTrends)
                .weeklyTrends(weeklyTrends)
                .monthlyTrends(monthlyTrends)
                .build();
    }

    private Map<String, DashboardResponse.DepartmentStats> getDepartmentStatistics() {
        Map<String, DashboardResponse.DepartmentStats> stats = new HashMap<>();

        List<Department> departments = departmentRepository.findAllActiveDepartments();

        for (Department dept : departments) {
            long grievanceCount = grievanceRepository.countByDepartment_Id(dept.getId());
            long resolvedCount = grievanceRepository.findByDepartment_IdOrderByCreatedAtDesc(dept.getId())
                    .stream()
                    .filter(g -> g.getStatus() == GrievanceStatus.RESOLVED)
                    .count();

            Double avgRating = feedbackRepository.getAverageRatingByDepartment(dept.getId());
            Double avgResolutionTime = grievanceRepository.getAverageResolutionTimeByDepartment(dept.getId());

            DashboardResponse.DepartmentStats departmentStats = DashboardResponse.DepartmentStats.builder()
                    .departmentId(dept.getId())
                    .departmentName(dept.getName())
                    .grievanceCount(grievanceCount)
                    .resolvedCount(resolvedCount)
                    .averageRating(avgRating != null ? avgRating : 0.0)
                    .averageResolutionTime(avgResolutionTime != null ? avgResolutionTime : 0.0)
                    .build();

            stats.put(dept.getName(), departmentStats);
        }

        return stats;
    }

    private Map<String, Long> calculateDailyTrends() {
        Map<String, Long> trends = new HashMap<>();
        LocalDateTime today = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS);

        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = today.minusDays(i);
            LocalDateTime dayEnd = dayStart.plusDays(1);

            List<Grievance> dayGrievances = grievanceRepository.findByDateRange(dayStart, dayEnd);
            String dayKey = dayStart.toLocalDate().toString();
            trends.put(dayKey, (long) dayGrievances.size());
        }

        return trends;
    }

    private Map<String, Long> calculateWeeklyTrends() {
        Map<String, Long> trends = new HashMap<>();
        LocalDateTime today = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS);
        LocalDateTime weekStart = today.minusWeeks(1);

        for (int i = 0; i < 4; i++) {
            LocalDateTime start = weekStart.plusWeeks(i);
            LocalDateTime end = start.plusWeeks(1);

            List<Grievance> weekGrievances = grievanceRepository.findByDateRange(start, end);
            String weekKey = "Week " + (i + 1);
            trends.put(weekKey, (long) weekGrievances.size());
        }

        return trends;
    }

    private Map<String, Long> calculateMonthlyTrends() {
        Map<String, Long> trends = new HashMap<>();
        LocalDateTime today = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS);

        for (int i = 11; i >= 0; i--) {
            LocalDateTime monthStart = today.minusMonths(i).withDayOfMonth(1);
            LocalDateTime monthEnd = monthStart.plusMonths(1);

            List<Grievance> monthGrievances = grievanceRepository.findByDateRange(monthStart, monthEnd);
            String monthKey = monthStart.getMonth().toString();
            trends.put(monthKey, (long) monthGrievances.size());
        }

        return trends;
    }

    public Map<String, Long> getGrievancesByStatus() {
        Map<String, Long> statusMap = new HashMap<>();
        statusMap.put("PENDING", grievanceRepository.countByStatus(GrievanceStatus.PENDING));
        statusMap.put("IN_PROGRESS", grievanceRepository.countByStatus(GrievanceStatus.IN_PROGRESS));
        statusMap.put("RESOLVED", grievanceRepository.countByStatus(GrievanceStatus.RESOLVED));
        statusMap.put("REJECTED", grievanceRepository.countByStatus(GrievanceStatus.REJECTED));
        return statusMap;
    }
}
