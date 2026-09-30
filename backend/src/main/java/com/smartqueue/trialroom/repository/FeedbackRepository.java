package com.smartqueue.trialroom.repository;

import com.smartqueue.trialroom.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    Optional<Feedback> findByQueueTicketId(Long queueTicketId);
    List<Feedback> findByStoreIdOrderBySubmittedAtDesc(Long storeId);
    List<Feedback> findAllByOrderBySubmittedAtDesc();

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.storeId = :storeId")
    Double getAverageRatingByStore(@Param("storeId") Long storeId);

    @Query("SELECT AVG(f.rating) FROM Feedback f")
    Double getOverallAverageRating();
}
