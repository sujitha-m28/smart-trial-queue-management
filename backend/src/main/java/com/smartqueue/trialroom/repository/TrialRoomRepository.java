package com.smartqueue.trialroom.repository;

import com.smartqueue.trialroom.entity.RoomStatus;
import com.smartqueue.trialroom.entity.TrialRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrialRoomRepository extends JpaRepository<TrialRoom, Long> {
    List<TrialRoom> findByStoreId(Long storeId);
    List<TrialRoom> findByStoreIdAndStatus(Long storeId, RoomStatus status);
    List<TrialRoom> findByStoreIdAndActiveTrue(Long storeId);
}
