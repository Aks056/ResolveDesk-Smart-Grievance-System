package com.grievance.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.grievance.dto.response.UserResponse;
import com.grievance.entity.Department;
import com.grievance.exception.BadRequestException;
import com.grievance.exception.ResourceNotFoundException;
import com.grievance.repository.DepartmentRepository;
import com.grievance.repository.GrievanceRepository;
import com.grievance.repository.UserRepository;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@AllArgsConstructor
@Transactional
public class DepartmentService {

    private DepartmentRepository departmentRepository;
    private GrievanceRepository grievanceRepository;
    private UserRepository userRepository;
    private ModelMapper modelMapper;

    public Department createDepartment(String name, String description, String contactEmail) {
        log.info("Creating new department: {}", name);

        if (departmentRepository.existsByName(name)) {
            throw new BadRequestException("Department name already exists");
        }

        Department department = Department.builder()
                .name(name)
                .description(description)
                .contactEmail(contactEmail)
                .isActive(true)
                .build();

        Department saved = departmentRepository.save(department);
        log.info("Department created: {} (ID: {})", name, saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public Department getDepartmentById(Long departmentId) {
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", departmentId));
    }

    @Transactional(readOnly = true)
    public Department getDepartmentByName(String name) {
        return departmentRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "name", name));
    }

    @Transactional(readOnly = true)
    public List<Department> getAllDepartments() {
        return departmentRepository.findAllDepartments();
    }

    @Transactional(readOnly = true)
    public List<Department> getActiveDepartments() {
        return departmentRepository.findAllActiveDepartments();
    }

    @Transactional(readOnly = true)
    public Page<Department> getAllDepartmentsPaginated(Pageable pageable) {
        return departmentRepository.findAll(pageable);
    }

    public Department updateDepartment(Long departmentId, String name, String description, String contactEmail) {
        log.info("Updating department: {}", departmentId);

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", departmentId));

        if (!department.getName().equals(name) && departmentRepository.existsByName(name)) {
            throw new BadRequestException("Department name already exists");
        }

        department.setName(name);
        department.setDescription(description);
        department.setContactEmail(contactEmail);

        return departmentRepository.save(department);
    }

    public void deactivateDepartment(Long departmentId) {
        log.info("Deactivating department: {}", departmentId);

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", departmentId));

        department.setIsActive(false);
        departmentRepository.save(department);
    }

    public void deleteDepartment(Long departmentId) {
        log.info("Deleting department: {}", departmentId);

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", departmentId));

        departmentRepository.delete(department);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getOfficersByDepartment(Long departmentId) {
        log.debug("Fetching officers for department: {}", departmentId);

        return userRepository.findActiveOfficersByDepartment(departmentId).stream()
                .map(officer -> modelMapper.map(officer, UserResponse.class))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getGrievanceCountByDepartment(Long departmentId) {
        return grievanceRepository.countByDepartment_Id(departmentId);
    }
}
