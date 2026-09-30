package com.smartqueue.trialroom.service;

import com.smartqueue.trialroom.dto.StoreDtos.*;
import com.smartqueue.trialroom.entity.*;
import com.smartqueue.trialroom.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final TrialRoomRepository trialRoomRepository;
    private final QueueRuleRepository queueRuleRepository;
    private final ServiceTypeRepository serviceTypeRepository;
    private final QueueTicketRepository queueTicketRepository;
    private final FeedbackRepository feedbackRepository;
    private final AuditLogService auditLogService;

    public List<StoreDto> getAllStores() {
        return storeRepository.findAll().stream()
                .map(this::mapToStoreDto)
                .collect(Collectors.toList());
    }

    public StoreDto getStoreById(Long id) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store not found with ID: " + id));
        return mapToStoreDto(store);
    }

    public StoreDto getStoreByCode(String code) {
        Store store = storeRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Store not found with code: " + code));
        return mapToStoreDto(store);
    }

    @Transactional
    public StoreDto createStore(StoreDto dto, String username) {
        if (storeRepository.existsByCode(dto.getCode())) {
            throw new RuntimeException("Store with code " + dto.getCode() + " already exists");
        }

        Store store = Store.builder()
                .code(dto.getCode().toUpperCase())
                .name(dto.getName())
                .location(dto.getLocation())
                .address(dto.getAddress())
                .contactPhone(dto.getContactPhone())
                .openingHours(dto.getOpeningHours() != null ? dto.getOpeningHours() : "10:00 - 22:00")
                .totalRooms(dto.getTotalRooms() != null ? dto.getTotalRooms() : 4)
                .active(true)
                .build();
        store = storeRepository.save(store);

        // Auto-create trial rooms for new store
        for (int i = 1; i <= store.getTotalRooms(); i++) {
            TrialRoom room = TrialRoom.builder()
                    .storeId(store.getId())
                    .roomNumber("Room " + String.format("%02d", i))
                    .roomType(i == 1 ? "EXPRESS" : (i == store.getTotalRooms() ? "VIP" : "REGULAR"))
                    .status(RoomStatus.AVAILABLE)
                    .active(true)
                    .build();
            trialRoomRepository.save(room);
        }

        // Auto-create default queue rule
        QueueRule rule = QueueRule.builder()
                .storeId(store.getId())
                .maxGarmentsPerPerson(6)
                .bufferTimeMinutes(2)
                .autoNoShowMinutes(5)
                .vipPriorityMultiplier(1.5)
                .enableAiOptimization(true)
                .sendSmsNotifications(true)
                .build();
        queueRuleRepository.save(rule);

        auditLogService.log(username, "ADMIN", "CREATE_STORE", "Store", store.getId().toString(), "Created store " + store.getName(), store.getId());
        return mapToStoreDto(store);
    }

    @Transactional
    public StoreDto updateStore(Long id, StoreDto dto, String username) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store not found with ID: " + id));

        store.setName(dto.getName());
        store.setLocation(dto.getLocation());
        store.setAddress(dto.getAddress());
        store.setContactPhone(dto.getContactPhone());
        store.setOpeningHours(dto.getOpeningHours());
        store.setActive(dto.isActive());

        store = storeRepository.save(store);
        auditLogService.log(username, "ADMIN", "UPDATE_STORE", "Store", store.getId().toString(), "Updated store " + store.getName(), store.getId());
        return mapToStoreDto(store);
    }

    @Transactional
    public void deleteStore(Long id, String username) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store not found with ID: " + id));
        store.setActive(false);
        storeRepository.save(store);
        auditLogService.log(username, "ADMIN", "DEACTIVATE_STORE", "Store", id.toString(), "Deactivated store " + store.getName(), id);
    }

    public List<ServiceTypeDto> getAllServiceTypes() {
        return serviceTypeRepository.findAll().stream()
                .map(this::mapToServiceTypeDto)
                .collect(Collectors.toList());
    }

    public QueueRuleDto getQueueRule(Long storeId) {
        QueueRule rule = queueRuleRepository.findByStoreId(storeId)
                .orElseGet(() -> queueRuleRepository.save(QueueRule.builder().storeId(storeId).build()));
        return QueueRuleDto.builder()
                .id(rule.getId())
                .storeId(rule.getStoreId())
                .maxGarmentsPerPerson(rule.getMaxGarmentsPerPerson())
                .bufferTimeMinutes(rule.getBufferTimeMinutes())
                .autoNoShowMinutes(rule.getAutoNoShowMinutes())
                .vipPriorityMultiplier(rule.getVipPriorityMultiplier())
                .enableAiOptimization(rule.isEnableAiOptimization())
                .sendSmsNotifications(rule.isSendSmsNotifications())
                .build();
    }

    @Transactional
    public QueueRuleDto updateQueueRule(Long storeId, QueueRuleDto dto, String username) {
        QueueRule rule = queueRuleRepository.findByStoreId(storeId)
                .orElseGet(() -> QueueRule.builder().storeId(storeId).build());

        if (dto.getMaxGarmentsPerPerson() != null) rule.setMaxGarmentsPerPerson(dto.getMaxGarmentsPerPerson());
        if (dto.getBufferTimeMinutes() != null) rule.setBufferTimeMinutes(dto.getBufferTimeMinutes());
        if (dto.getAutoNoShowMinutes() != null) rule.setAutoNoShowMinutes(dto.getAutoNoShowMinutes());
        if (dto.getVipPriorityMultiplier() != null) rule.setVipPriorityMultiplier(dto.getVipPriorityMultiplier());
        rule.setEnableAiOptimization(dto.isEnableAiOptimization());
        rule.setSendSmsNotifications(dto.isSendSmsNotifications());

        rule = queueRuleRepository.save(rule);
        auditLogService.log(username, "ADMIN", "UPDATE_QUEUE_RULE", "QueueRule", rule.getId().toString(), "Updated queue rules for store " + storeId, storeId);

        return getQueueRule(storeId);
    }

    private StoreDto mapToStoreDto(Store store) {
        int waiting = queueTicketRepository.findByStoreIdAndStatus(store.getId(), TicketStatus.WAITING).size();
        int serving = queueTicketRepository.findByStoreIdAndStatus(store.getId(), TicketStatus.IN_SERVICE).size() +
                      queueTicketRepository.findByStoreIdAndStatus(store.getId(), TicketStatus.CALLED).size();
        Double avgRating = feedbackRepository.getAverageRatingByStore(store.getId());

        return StoreDto.builder()
                .id(store.getId())
                .code(store.getCode())
                .name(store.getName())
                .location(store.getLocation())
                .address(store.getAddress())
                .contactPhone(store.getContactPhone())
                .openingHours(store.getOpeningHours())
                .totalRooms(store.getTotalRooms())
                .active(store.isActive())
                .currentWaiting(waiting)
                .currentServing(serving)
                .avgRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 4.8)
                .build();
    }

    private ServiceTypeDto mapToServiceTypeDto(ServiceType st) {
        return ServiceTypeDto.builder()
                .id(st.getId())
                .code(st.getCode())
                .name(st.getName())
                .description(st.getDescription())
                .maxItems(st.getMaxItems())
                .avgServiceMinutes(st.getAvgServiceMinutes())
                .priorityLevel(st.getPriorityLevel())
                .active(st.isActive())
                .build();
    }
}
