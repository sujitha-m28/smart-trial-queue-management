package com.smartqueue.trialroom.repository;

import com.smartqueue.trialroom.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop100ByOrderByTimestampDesc();
    List<AuditLog> findTop100ByStoreIdOrderByTimestampDesc(Long storeId);
}
