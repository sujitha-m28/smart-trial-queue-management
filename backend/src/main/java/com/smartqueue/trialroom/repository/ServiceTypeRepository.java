package com.smartqueue.trialroom.repository;

import com.smartqueue.trialroom.entity.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceTypeRepository extends JpaRepository<ServiceType, Long> {
    Optional<ServiceType> findByCode(String code);
    List<ServiceType> findByActiveTrue();
}
