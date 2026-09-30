package com.smartqueue.trialroom.repository;

import com.smartqueue.trialroom.entity.QueueTicket;
import com.smartqueue.trialroom.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {

    Optional<QueueTicket> findByTokenNumber(String tokenNumber);

    List<QueueTicket> findByStoreIdAndStatusInOrderByPriorityLevelDescJoinedAtAsc(Long storeId, List<TicketStatus> statuses);

    List<QueueTicket> findByStoreIdAndStatusOrderByPriorityLevelDescJoinedAtAsc(Long storeId, TicketStatus status);

    List<QueueTicket> findByStoreIdAndStatus(Long storeId, TicketStatus status);

    List<QueueTicket> findByCustomerPhoneAndStatusIn(String phone, List<TicketStatus> statuses);

    List<QueueTicket> findByCustomerUserIdAndStatusIn(Long customerUserId, List<TicketStatus> statuses);

    @Query("SELECT COUNT(q) FROM QueueTicket q WHERE q.storeId = :storeId AND q.status = 'WAITING' AND (q.priorityLevel > :priority OR (q.priorityLevel = :priority AND q.joinedAt < :joinedAt))")
    long countPeopleAhead(@Param("storeId") Long storeId, @Param("priority") Integer priority, @Param("joinedAt") LocalDateTime joinedAt);

    @Query("SELECT q FROM QueueTicket q WHERE q.storeId = :storeId AND q.status = 'CALLED' ORDER BY q.calledAt DESC")
    List<QueueTicket> findCurrentlyServing(@Param("storeId") Long storeId);

    @Query("SELECT q FROM QueueTicket q WHERE q.storeId = :storeId AND q.joinedAt >= :startOfDay ORDER BY q.joinedAt DESC")
    List<QueueTicket> findTodayTicketsByStore(@Param("storeId") Long storeId, @Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT q FROM QueueTicket q WHERE q.joinedAt >= :startOfDay ORDER BY q.joinedAt DESC")
    List<QueueTicket> findAllTodayTickets(@Param("startOfDay") LocalDateTime startOfDay);
}
