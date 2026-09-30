package com.smartqueue.trialroom.repository;

import com.smartqueue.trialroom.entity.QueueRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QueueRuleRepository extends JpaRepository<QueueRule, Long> {
    Optional<QueueRule> findByStoreId(Long storeId);
}
