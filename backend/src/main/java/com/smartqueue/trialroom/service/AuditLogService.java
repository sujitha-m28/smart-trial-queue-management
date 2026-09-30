package com.smartqueue.trialroom.service;

import com.smartqueue.trialroom.entity.AuditLog;
import com.smartqueue.trialroom.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(String actorUsername, String actorRole, String action, String entityName, String entityId, String details, Long storeId) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .actorUsername(actorUsername != null ? actorUsername : "ANONYMOUS")
                    .actorRole(actorRole != null ? actorRole : "SYSTEM")
                    .action(action)
                    .entityName(entityName)
                    .entityId(entityId)
                    .details(details)
                    .storeId(storeId)
                    .build();
            auditLogRepository.save(auditLog);
            log.info("[AUDIT] {} - {} by {} ({}) - {}", action, entityName + "/" + entityId, actorUsername, actorRole, details);
        } catch (Exception e) {
            log.error("Failed to write audit log", e);
        }
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }

    public List<AuditLog> getLogsByStore(Long storeId) {
        return auditLogRepository.findTop100ByStoreIdOrderByTimestampDesc(storeId);
    }
}
