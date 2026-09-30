package com.smartqueue.trialroom.service;

import com.smartqueue.trialroom.dto.QueueDtos.*;
import com.smartqueue.trialroom.entity.*;
import com.smartqueue.trialroom.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QueueService {

    private final QueueTicketRepository queueTicketRepository;
    private final StoreRepository storeRepository;
    private final TrialRoomRepository trialRoomRepository;
    private final ServiceTypeRepository serviceTypeRepository;
    private final QueueRuleRepository queueRuleRepository;
    private final UserRepository userRepository;
    private final WebSocketNotificationService wsNotificationService;
    private final AuditLogService auditLogService;

    // Token sequence counters per store
    private final Map<Long, AtomicInteger> storeTokenCounters = new HashMap<>();

    @Transactional
    public QueueTicketDto joinQueue(JoinQueueRequest request, Long customerUserId, String customerUsername) {
        Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new RuntimeException("Store not found with ID: " + request.getStoreId()));

        ServiceType serviceType = null;
        if (request.getServiceTypeId() != null) {
            serviceType = serviceTypeRepository.findById(request.getServiceTypeId()).orElse(null);
        }

        QueueRule rule = queueRuleRepository.findByStoreId(store.getId())
                .orElseGet(() -> QueueRule.builder().storeId(store.getId()).build());

        // Validate garment limit
        int garmentCount = request.getGarmentCount() != null ? request.getGarmentCount() : 3;
        if (garmentCount > rule.getMaxGarmentsPerPerson()) {
            garmentCount = rule.getMaxGarmentsPerPerson();
        }

        // Determine token prefix & priority
        String prefix = "TR-";
        int priority = request.isVip() ? 3 : 1;
        if (serviceType != null) {
            if ("EXPRESS".equalsIgnoreCase(serviceType.getCode())) {
                prefix = "EXP-";
                priority = Math.max(priority, 2);
            } else if ("VIP".equalsIgnoreCase(serviceType.getCode())) {
                prefix = "VIP-";
                priority = Math.max(priority, 3);
            }
        }

        // Generate Token Number
        AtomicInteger counter = storeTokenCounters.computeIfAbsent(store.getId(), k -> {
            LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
            int countToday = queueTicketRepository.findTodayTicketsByStore(k, startOfDay).size();
            return new AtomicInteger(countToday + 40); // Base starting token for realistic demo
        });
        int tokenSeq = counter.incrementAndGet();
        String tokenNumber = prefix + String.format("%03d", tokenSeq);

        // Intelligent Wait Time Calculation
        int peopleAhead = (int) queueTicketRepository.countPeopleAhead(store.getId(), priority, LocalDateTime.now());
        int estimatedWaitMinutes = calculateEstimatedWaitTime(store.getId(), peopleAhead, garmentCount, rule);

        QueueTicket ticket = QueueTicket.builder()
                .tokenNumber(tokenNumber)
                .storeId(store.getId())
                .serviceTypeId(serviceType != null ? serviceType.getId() : null)
                .serviceTypeName(serviceType != null ? serviceType.getName() : "Standard Trial Room")
                .customerUserId(customerUserId)
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .customerEmail(request.getCustomerEmail())
                .garmentCount(garmentCount)
                .status(TicketStatus.WAITING)
                .priorityLevel(priority)
                .estimatedWaitMinutes(estimatedWaitMinutes)
                .peopleAhead(peopleAhead)
                .notes(request.getNotes())
                .build();

        ticket = queueTicketRepository.save(ticket);

        auditLogService.log(
                customerUsername != null ? customerUsername : request.getCustomerName(),
                "CUSTOMER",
                "JOIN_QUEUE",
                "QueueTicket",
                ticket.getTokenNumber(),
                "Joined queue with " + garmentCount + " garments. Est wait: " + estimatedWaitMinutes + "m",
                store.getId()
        );

        QueueTicketDto dto = mapToDto(ticket, store);

        // Broadcast real-time update
        broadcastQueueUpdates(store.getId(), ticket.getTokenNumber(), dto);

        return dto;
    }

    public QueueTicketDto getTicketStatus(String tokenNumber) {
        QueueTicket ticket = queueTicketRepository.findByTokenNumber(tokenNumber)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + tokenNumber));
        Store store = storeRepository.findById(ticket.getStoreId()).orElse(null);

        if (ticket.getStatus() == TicketStatus.WAITING) {
            int currentPeopleAhead = (int) queueTicketRepository.countPeopleAhead(ticket.getStoreId(), ticket.getPriorityLevel(), ticket.getJoinedAt());
            QueueRule rule = queueRuleRepository.findByStoreId(ticket.getStoreId()).orElseGet(() -> QueueRule.builder().build());
            int dynamicWait = calculateEstimatedWaitTime(ticket.getStoreId(), currentPeopleAhead, ticket.getGarmentCount(), rule);
            ticket.setPeopleAhead(currentPeopleAhead);
            ticket.setEstimatedWaitMinutes(dynamicWait);
        }

        return mapToDto(ticket, store);
    }

    public QueueTicketDto getTicketById(Long id) {
        QueueTicket ticket = queueTicketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with ID: " + id));
        Store store = storeRepository.findById(ticket.getStoreId()).orElse(null);
        return mapToDto(ticket, store);
    }

    @Transactional
    public QueueTicketDto callNextTicket(CallTicketRequest request, String staffUsername) {
        Long storeId = request.getStoreId();
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found with ID: " + storeId));

        User staffUser = userRepository.findByUsername(staffUsername).orElse(null);

        // Find candidate ticket
        QueueTicket ticket;
        if (request.getTicketId() != null) {
            ticket = queueTicketRepository.findById(request.getTicketId())
                    .orElseThrow(() -> new RuntimeException("Ticket not found with ID: " + request.getTicketId()));
        } else {
            List<QueueTicket> waitingList = queueTicketRepository.findByStoreIdAndStatusOrderByPriorityLevelDescJoinedAtAsc(storeId, TicketStatus.WAITING);
            if (waitingList.isEmpty()) {
                throw new RuntimeException("No waiting customers in the queue!");
            }
            ticket = waitingList.get(0);
        }

        // Room allocation
        TrialRoom room = null;
        if (request.getRoomId() != null) {
            room = trialRoomRepository.findById(request.getRoomId()).orElse(null);
        }
        if (room == null) {
            List<TrialRoom> availableRooms = trialRoomRepository.findByStoreIdAndStatus(storeId, RoomStatus.AVAILABLE);
            if (!availableRooms.isEmpty()) {
                room = availableRooms.get(0);
            }
        }

        ticket.setStatus(TicketStatus.CALLED);
        ticket.setCalledAt(LocalDateTime.now());
        if (staffUser != null) {
            ticket.setAssignedStaffId(staffUser.getId());
            ticket.setAssignedStaffName(staffUser.getFullName());
        }

        if (room != null) {
            ticket.setAssignedRoomId(room.getId());
            ticket.setAssignedRoomNumber(room.getRoomNumber());
            room.setStatus(RoomStatus.OCCUPIED);
            room.setCurrentTicketId(ticket.getId());
            room.setCurrentTokenNumber(ticket.getTokenNumber());
            trialRoomRepository.save(room);
        }

        ticket = queueTicketRepository.save(ticket);

        auditLogService.log(
                staffUsername,
                "STAFF",
                "CALL_TICKET",
                "QueueTicket",
                ticket.getTokenNumber(),
                "Called token " + ticket.getTokenNumber() + (room != null ? " to " + room.getRoomNumber() : ""),
                storeId
        );

        QueueTicketDto dto = mapToDto(ticket, store);
        broadcastQueueUpdates(storeId, ticket.getTokenNumber(), dto);

        return dto;
    }

    @Transactional
    public QueueTicketDto startService(Long ticketId, Long roomId, String staffUsername) {
        QueueTicket ticket = queueTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        ticket.setStatus(TicketStatus.IN_SERVICE);
        ticket.setServiceStartedAt(LocalDateTime.now());

        if (roomId != null) {
            TrialRoom room = trialRoomRepository.findById(roomId).orElse(null);
            if (room != null) {
                room.setStatus(RoomStatus.OCCUPIED);
                room.setCurrentTicketId(ticket.getId());
                room.setCurrentTokenNumber(ticket.getTokenNumber());
                trialRoomRepository.save(room);
                ticket.setAssignedRoomId(room.getId());
                ticket.setAssignedRoomNumber(room.getRoomNumber());
            }
        }

        ticket = queueTicketRepository.save(ticket);
        auditLogService.log(staffUsername, "STAFF", "START_SERVICE", "QueueTicket", ticket.getTokenNumber(), "Fitting started in " + ticket.getAssignedRoomNumber(), ticket.getStoreId());

        Store store = storeRepository.findById(ticket.getStoreId()).orElse(null);
        QueueTicketDto dto = mapToDto(ticket, store);
        broadcastQueueUpdates(ticket.getStoreId(), ticket.getTokenNumber(), dto);
        return dto;
    }

    @Transactional
    public QueueTicketDto completeService(Long ticketId, String staffUsername) {
        QueueTicket ticket = queueTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        ticket.setStatus(TicketStatus.COMPLETED);
        ticket.setCompletedAt(LocalDateTime.now());

        LocalDateTime start = ticket.getServiceStartedAt() != null ? ticket.getServiceStartedAt() : ticket.getCalledAt();
        if (start != null) {
            long durationMins = Duration.between(start, ticket.getCompletedAt()).toMinutes();
            ticket.setActualServiceDurationMinutes((int) Math.max(durationMins, 1));
        } else {
            ticket.setActualServiceDurationMinutes(6);
        }

        // Release room
        if (ticket.getAssignedRoomId() != null) {
            TrialRoom room = trialRoomRepository.findById(ticket.getAssignedRoomId()).orElse(null);
            if (room != null) {
                room.setStatus(RoomStatus.AVAILABLE);
                room.setCurrentTicketId(null);
                room.setCurrentTokenNumber(null);
                trialRoomRepository.save(room);
            }
        }

        ticket = queueTicketRepository.save(ticket);
        auditLogService.log(staffUsername, "STAFF", "COMPLETE_SERVICE", "QueueTicket", ticket.getTokenNumber(), "Service completed in " + ticket.getActualServiceDurationMinutes() + " mins", ticket.getStoreId());

        Store store = storeRepository.findById(ticket.getStoreId()).orElse(null);
        QueueTicketDto dto = mapToDto(ticket, store);
        broadcastQueueUpdates(ticket.getStoreId(), ticket.getTokenNumber(), dto);
        return dto;
    }

    @Transactional
    public QueueTicketDto skipTicket(Long ticketId, String staffUsername) {
        QueueTicket ticket = queueTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        ticket.setStatus(TicketStatus.SKIPPED);
        releaseRoomForTicket(ticket);

        ticket = queueTicketRepository.save(ticket);
        auditLogService.log(staffUsername, "STAFF", "SKIP_TICKET", "QueueTicket", ticket.getTokenNumber(), "Customer skipped", ticket.getStoreId());

        Store store = storeRepository.findById(ticket.getStoreId()).orElse(null);
        QueueTicketDto dto = mapToDto(ticket, store);
        broadcastQueueUpdates(ticket.getStoreId(), ticket.getTokenNumber(), dto);
        return dto;
    }

    @Transactional
    public QueueTicketDto recallTicket(Long ticketId, String staffUsername) {
        QueueTicket ticket = queueTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        ticket.setStatus(TicketStatus.CALLED);
        ticket.setCalledAt(LocalDateTime.now());
        ticket = queueTicketRepository.save(ticket);

        auditLogService.log(staffUsername, "STAFF", "RECALL_TICKET", "QueueTicket", ticket.getTokenNumber(), "Customer recalled", ticket.getStoreId());

        Store store = storeRepository.findById(ticket.getStoreId()).orElse(null);
        QueueTicketDto dto = mapToDto(ticket, store);
        broadcastQueueUpdates(ticket.getStoreId(), ticket.getTokenNumber(), dto);
        return dto;
    }

    @Transactional
    public QueueTicketDto markNoShow(Long ticketId, String staffUsername) {
        QueueTicket ticket = queueTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        ticket.setStatus(TicketStatus.NO_SHOW);
        releaseRoomForTicket(ticket);

        ticket = queueTicketRepository.save(ticket);
        auditLogService.log(staffUsername, "STAFF", "MARK_NO_SHOW", "QueueTicket", ticket.getTokenNumber(), "Customer marked as No-Show", ticket.getStoreId());

        Store store = storeRepository.findById(ticket.getStoreId()).orElse(null);
        QueueTicketDto dto = mapToDto(ticket, store);
        broadcastQueueUpdates(ticket.getStoreId(), ticket.getTokenNumber(), dto);
        return dto;
    }

    @Transactional
    public QueueTicketDto cancelTicket(Long ticketId, String reason, String username) {
        QueueTicket ticket = queueTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        ticket.setStatus(TicketStatus.CANCELLED);
        ticket.setNotes(reason != null ? "Cancelled: " + reason : "Cancelled by user");
        releaseRoomForTicket(ticket);

        ticket = queueTicketRepository.save(ticket);
        auditLogService.log(username != null ? username : "CUSTOMER", "CUSTOMER", "CANCEL_QUEUE", "QueueTicket", ticket.getTokenNumber(), "Queue cancelled by user", ticket.getStoreId());

        Store store = storeRepository.findById(ticket.getStoreId()).orElse(null);
        QueueTicketDto dto = mapToDto(ticket, store);
        broadcastQueueUpdates(ticket.getStoreId(), ticket.getTokenNumber(), dto);
        return dto;
    }

    public QueueSummaryDto getStoreQueueSummary(Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found with ID: " + storeId));

        List<QueueTicket> waitingTickets = queueTicketRepository.findByStoreIdAndStatusOrderByPriorityLevelDescJoinedAtAsc(storeId, TicketStatus.WAITING);
        List<QueueTicket> activeTickets = queueTicketRepository.findByStoreIdAndStatusInOrderByPriorityLevelDescJoinedAtAsc(
                storeId, Arrays.asList(TicketStatus.CALLED, TicketStatus.IN_SERVICE));

        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        List<QueueTicket> todayTickets = queueTicketRepository.findTodayTicketsByStore(storeId, startOfDay);
        int completedToday = (int) todayTickets.stream().filter(t -> t.getStatus() == TicketStatus.COMPLETED).count();

        String nowServing = activeTickets.isEmpty() ? "None" : activeTickets.get(0).getTokenNumber();
        String nextToken = waitingTickets.isEmpty() ? "None" : waitingTickets.get(0).getTokenNumber();

        List<TrialRoom> rooms = trialRoomRepository.findByStoreId(storeId);
        List<RoomCardDto> roomCards = rooms.stream().map(r -> {
            RoomCardDto card = RoomCardDto.builder()
                    .roomId(r.getId())
                    .roomNumber(r.getRoomNumber())
                    .roomType(r.getRoomType())
                    .status(r.getStatus())
                    .currentTicketId(r.getCurrentTicketId())
                    .currentTokenNumber(r.getCurrentTokenNumber())
                    .build();

            if (r.getCurrentTicketId() != null) {
                queueTicketRepository.findById(r.getCurrentTicketId()).ifPresent(t -> {
                    card.setCustomerName(t.getCustomerName());
                    card.setGarmentCount(t.getGarmentCount());
                    card.setServiceStartedAt(t.getServiceStartedAt() != null ? t.getServiceStartedAt() : t.getCalledAt());
                    if (card.getServiceStartedAt() != null) {
                        card.setElapsedMinutes((int) Duration.between(card.getServiceStartedAt(), LocalDateTime.now()).toMinutes());
                    }
                });
            }
            return card;
        }).collect(Collectors.toList());

        QueueRule rule = queueRuleRepository.findByStoreId(storeId).orElseGet(() -> QueueRule.builder().build());
        int estWait = calculateEstimatedWaitTime(storeId, waitingTickets.size(), 3, rule);

        return QueueSummaryDto.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .nowServingToken(nowServing)
                .nextToken(nextToken)
                .waitingCount(waitingTickets.size())
                .servingCount(activeTickets.size())
                .completedToday(completedToday)
                .estimatedWaitMinutes(estWait)
                .waitingList(waitingTickets.stream().map(t -> mapToDto(t, store)).collect(Collectors.toList()))
                .activeList(activeTickets.stream().map(t -> mapToDto(t, store)).collect(Collectors.toList()))
                .rooms(roomCards)
                .build();
    }

    public PublicDisplayDto getPublicDisplayData(String storeCode) {
        Store store = storeRepository.findByCode(storeCode)
                .orElseThrow(() -> new RuntimeException("Store not found with code: " + storeCode));

        QueueSummaryDto summary = getStoreQueueSummary(store.getId());

        List<String> nowServing = summary.getActiveList().stream()
                .map(QueueTicketDto::getTokenNumber)
                .collect(Collectors.toList());

        return PublicDisplayDto.builder()
                .storeName(store.getName())
                .storeCode(store.getCode())
                .activeRooms(summary.getRooms())
                .nowServingTokens(nowServing)
                .upNextTokens(summary.getWaitingList().stream().limit(6).collect(Collectors.toList()))
                .totalWaiting(summary.getWaitingCount())
                .averageWaitMinutes(summary.getEstimatedWaitMinutes())
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    // Intelligent Wait-Time Prediction Engine
    public int calculateEstimatedWaitTime(Long storeId, int peopleAhead, int garmentCount, QueueRule rule) {
        if (peopleAhead <= 0) {
            return 2; // Immediate turn
        }

        List<TrialRoom> activeRooms = trialRoomRepository.findByStoreIdAndActiveTrue(storeId);
        int roomCount = Math.max(activeRooms.size(), 1);

        // Average fitting duration per garment = ~2.2 minutes + 1.5 min overhead buffer
        double avgMinutesPerCustomer = (garmentCount * 2.2) + (rule.getBufferTimeMinutes() != null ? rule.getBufferTimeMinutes() : 2.0);

        // Concurrency division across available trial rooms
        double queueRounds = (double) peopleAhead / (double) roomCount;
        int totalEstimatedMinutes = (int) Math.ceil(queueRounds * avgMinutesPerCustomer);

        return Math.max(totalEstimatedMinutes, 3);
    }

    private void releaseRoomForTicket(QueueTicket ticket) {
        if (ticket.getAssignedRoomId() != null) {
            TrialRoom room = trialRoomRepository.findById(ticket.getAssignedRoomId()).orElse(null);
            if (room != null) {
                room.setStatus(RoomStatus.AVAILABLE);
                room.setCurrentTicketId(null);
                room.setCurrentTokenNumber(null);
                trialRoomRepository.save(room);
            }
        }
    }

    private void broadcastQueueUpdates(Long storeId, String tokenNumber, QueueTicketDto ticketDto) {
        wsNotificationService.broadcastTicketUpdate(tokenNumber, ticketDto);
        try {
            QueueSummaryDto summary = getStoreQueueSummary(storeId);
            wsNotificationService.broadcastStoreQueueUpdate(storeId, summary);
            storeRepository.findById(storeId).ifPresent(s -> {
                PublicDisplayDto display = getPublicDisplayData(s.getCode());
                wsNotificationService.broadcastPublicDisplay(s.getCode(), display);
            });
        } catch (Exception e) {
            log.error("Failed broadcasting summary update", e);
        }
    }

    private QueueTicketDto mapToDto(QueueTicket ticket, Store store) {
        String currentlyServing = "None";
        if (store != null) {
            List<QueueTicket> active = queueTicketRepository.findByStoreIdAndStatus(store.getId(), TicketStatus.IN_SERVICE);
            if (active.isEmpty()) {
                active = queueTicketRepository.findByStoreIdAndStatus(store.getId(), TicketStatus.CALLED);
            }
            if (!active.isEmpty()) {
                currentlyServing = active.get(0).getTokenNumber();
            }
        }

        return QueueTicketDto.builder()
                .id(ticket.getId())
                .tokenNumber(ticket.getTokenNumber())
                .storeId(ticket.getStoreId())
                .storeName(store != null ? store.getName() : "Trial Room")
                .serviceTypeId(ticket.getServiceTypeId())
                .serviceTypeName(ticket.getServiceTypeName())
                .customerUserId(ticket.getCustomerUserId())
                .customerName(ticket.getCustomerName())
                .customerPhone(ticket.getCustomerPhone())
                .customerEmail(ticket.getCustomerEmail())
                .garmentCount(ticket.getGarmentCount())
                .status(ticket.getStatus())
                .priorityLevel(ticket.getPriorityLevel())
                .estimatedWaitMinutes(ticket.getEstimatedWaitMinutes() != null ? ticket.getEstimatedWaitMinutes() : 5)
                .peopleAhead(ticket.getPeopleAhead() != null ? ticket.getPeopleAhead() : 0)
                .assignedRoomId(ticket.getAssignedRoomId())
                .assignedRoomNumber(ticket.getAssignedRoomNumber())
                .assignedStaffId(ticket.getAssignedStaffId())
                .assignedStaffName(ticket.getAssignedStaffName())
                .joinedAt(ticket.getJoinedAt())
                .calledAt(ticket.getCalledAt())
                .serviceStartedAt(ticket.getServiceStartedAt())
                .completedAt(ticket.getCompletedAt())
                .actualServiceDurationMinutes(ticket.getActualServiceDurationMinutes())
                .notes(ticket.getNotes())
                .currentlyServingToken(currentlyServing)
                .build();
    }
}
