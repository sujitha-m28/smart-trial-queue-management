package com.smartqueue.trialroom.config;

import com.smartqueue.trialroom.entity.*;
import com.smartqueue.trialroom.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final TrialRoomRepository trialRoomRepository;
    private final ServiceTypeRepository serviceTypeRepository;
    private final QueueRuleRepository queueRuleRepository;
    private final QueueTicketRepository queueTicketRepository;
    private final FeedbackRepository feedbackRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already initialized, skipping seed data.");
            return;
        }

        log.info("Initializing Smart Trial Room Queue database with rich seed data...");

        // 1. Service Types
        ServiceType stStandard = ServiceType.builder()
                .code("REGULAR")
                .name("Standard Trial Room")
                .description("Standard fitting room for up to 6 garments")
                .maxItems(6)
                .avgServiceMinutes(8)
                .priorityLevel(1)
                .active(true)
                .build();

        ServiceType stExpress = ServiceType.builder()
                .code("EXPRESS")
                .name("Express Fitting (<= 2 Items)")
                .description("Priority fast-track queue for 1 or 2 garments only")
                .maxItems(2)
                .avgServiceMinutes(4)
                .priorityLevel(2)
                .active(true)
                .build();

        ServiceType stVip = ServiceType.builder()
                .code("VIP")
                .name("VIP Styling Lounge")
                .description("Luxury fitting suite with dedicated stylist assistance")
                .maxItems(10)
                .avgServiceMinutes(15)
                .priorityLevel(3)
                .active(true)
                .build();

        ServiceType stAccessible = ServiceType.builder()
                .code("ACCESSIBLE")
                .name("Accessible & Family Room")
                .description("Spacious fitting room with wheelchair access and stroller space")
                .maxItems(6)
                .avgServiceMinutes(10)
                .priorityLevel(1)
                .active(true)
                .build();

        serviceTypeRepository.saveAll(Arrays.asList(stStandard, stExpress, stVip, stAccessible));

        // 2. Stores
        Store store1 = Store.builder()
                .code("STR-NYC-01")
                .name("Smart Fashion Store")
                .location("Chennai, TN")
                .address("2812 Porur Bridge, Chennai, TN 2812")
                .contactPhone("+1 (212) 555-0199")
                .openingHours("09:00 - 22:00")
                .totalRooms(6)
                .active(true)
                .build();

        Store store2 = Store.builder()
                .code("STR-LA-02")
                .name("Strwberry Fashion Store")
                .location("Mumbai, MH")
                .address("2812, Mumbai, MH 2812")
                .contactPhone("+1 (310) 555-0144")
                .openingHours("10:00 - 21:00")
                .totalRooms(4)
                .active(true)
                .build();

        storeRepository.saveAll(Arrays.asList(store1, store2));

        // 3. Queue Rules
        QueueRule rule1 = QueueRule.builder()
                .storeId(store1.getId())
                .maxGarmentsPerPerson(6)
                .bufferTimeMinutes(2)
                .autoNoShowMinutes(5)
                .vipPriorityMultiplier(1.5)
                .enableAiOptimization(true)
                .sendSmsNotifications(true)
                .build();

        QueueRule rule2 = QueueRule.builder()
                .storeId(store2.getId())
                .maxGarmentsPerPerson(6)
                .bufferTimeMinutes(2)
                .autoNoShowMinutes(5)
                .vipPriorityMultiplier(1.5)
                .enableAiOptimization(true)
                .sendSmsNotifications(true)
                .build();

        queueRuleRepository.saveAll(Arrays.asList(rule1, rule2));

        // 4. Users (Role structure: ADMIN, STAFF, CUSTOMER)
        User admin = User.builder()
                .username("smart")
                .password(passwordEncoder.encode("smart@1953"))
                .fullName("System Administrator")
                .email("admin@smartqueue.com")
                .phone("+1 (800) 555-0100")
                .role(Role.ADMIN)
                .active(true)
                .build();

        User staff1 = User.builder()
                .username("staff1")
                .password(passwordEncoder.encode("staff@123"))
                .fullName("Prabha (Fitting Attendant)")
                .email("prabha.staff@smartqueue.com")
                .phone("+1 (212) 555-0122")
                .role(Role.STAFF)
                .storeId(store1.getId())
                .active(true)
                .build();

        User staff2 = User.builder()
                .username("staff2")
                .password(passwordEncoder.encode("staff@123"))
                .fullName("Mahii (Fitting Attendant)")
                .email("mahii.staff@smartqueue.com")
                .phone("+1 (310) 555-0133")
                .role(Role.STAFF)
                .storeId(store2.getId())
                .active(true)
                .build();

        User customer1 = User.builder()
                .username("suji")
                .password(passwordEncoder.encode("suji@1953"))
                .fullName("SUJITHA M")
                .email("smart.suji@gmail.com")
                .phone("+1 (555) 234-5678")
                .role(Role.CUSTOMER)
                .active(true)
                .build();

        userRepository.saveAll(Arrays.asList(admin, staff1, staff2, customer1));

        // 5. Trial Rooms for Store 1
        TrialRoom room1 = TrialRoom.builder().storeId(store1.getId()).roomNumber("Room 01 (Express)").roomType("EXPRESS").status(RoomStatus.OCCUPIED).currentTokenNumber("EXP-019").active(true).build();
        TrialRoom room2 = TrialRoom.builder().storeId(store1.getId()).roomNumber("Room 02").roomType("REGULAR").status(RoomStatus.OCCUPIED).currentTokenNumber("TR-038").active(true).build();
        TrialRoom room3 = TrialRoom.builder().storeId(store1.getId()).roomNumber("Room 03").roomType("REGULAR").status(RoomStatus.AVAILABLE).active(true).build();
        TrialRoom room4 = TrialRoom.builder().storeId(store1.getId()).roomNumber("Room 04").roomType("REGULAR").status(RoomStatus.AVAILABLE).active(true).build();
        TrialRoom room5 = TrialRoom.builder().storeId(store1.getId()).roomNumber("Room 05 (Family)").roomType("ACCESSIBLE").status(RoomStatus.AVAILABLE).active(true).build();
        TrialRoom room6 = TrialRoom.builder().storeId(store1.getId()).roomNumber("Room 06 (VIP)").roomType("VIP").status(RoomStatus.AVAILABLE).active(true).build();

        trialRoomRepository.saveAll(Arrays.asList(room1, room2, room3, room4, room5, room6));

        // Trial Rooms for Store 2
        TrialRoom r2_1 = TrialRoom.builder().storeId(store2.getId()).roomNumber("Room 01").roomType("REGULAR").status(RoomStatus.AVAILABLE).active(true).build();
        TrialRoom r2_2 = TrialRoom.builder().storeId(store2.getId()).roomNumber("Room 02").roomType("REGULAR").status(RoomStatus.AVAILABLE).active(true).build();
        trialRoomRepository.saveAll(Arrays.asList(r2_1, r2_2));

        // 6. Active & Completed Queue Tickets
        LocalDateTime now = LocalDateTime.now();

        // Active In-Service Tickets
        QueueTicket ticketInService1 = QueueTicket.builder()
                .tokenNumber("TR-038")
                .storeId(store1.getId())
                .serviceTypeId(stStandard.getId())
                .serviceTypeName(stStandard.getName())
                .customerName("Aswathy ")
                .customerPhone("+1 (555) 789-0123")
                .garmentCount(4)
                .status(TicketStatus.IN_SERVICE)
                .priorityLevel(1)
                .estimatedWaitMinutes(0)
                .peopleAhead(0)
                .assignedRoomId(room2.getId())
                .assignedRoomNumber(room2.getRoomNumber())
                .assignedStaffId(staff1.getId())
                .assignedStaffName(staff1.getFullName())
                .joinedAt(now.minusMinutes(18))
                .calledAt(now.minusMinutes(12))
                .serviceStartedAt(now.minusMinutes(8))
                .build();

        QueueTicket ticketInService2 = QueueTicket.builder()
                .tokenNumber("EXP-019")
                .storeId(store1.getId())
                .serviceTypeId(stExpress.getId())
                .serviceTypeName(stExpress.getName())
                .customerName("Shrii ")
                .customerPhone("+1 (555) 890-1234")
                .garmentCount(2)
                .status(TicketStatus.IN_SERVICE)
                .priorityLevel(2)
                .estimatedWaitMinutes(0)
                .peopleAhead(0)
                .assignedRoomId(room1.getId())
                .assignedRoomNumber(room1.getRoomNumber())
                .assignedStaffId(staff1.getId())
                .assignedStaffName(staff1.getFullName())
                .joinedAt(now.minusMinutes(12))
                .calledAt(now.minusMinutes(6))
                .serviceStartedAt(now.minusMinutes(4))
                .build();

        // Waiting Queue Tickets
        QueueTicket ticketWait1 = QueueTicket.builder()
                .tokenNumber("TR-039")
                .storeId(store1.getId())
                .serviceTypeId(stStandard.getId())
                .serviceTypeName(stStandard.getName())
                .customerName("Herwin Ahila")
                .customerPhone("+1 (555) 901-2345")
                .garmentCount(3)
                .status(TicketStatus.WAITING)
                .priorityLevel(1)
                .estimatedWaitMinutes(3)
                .peopleAhead(0)
                .joinedAt(now.minusMinutes(9))
                .build();

        QueueTicket ticketWait2 = QueueTicket.builder()
                .tokenNumber("VIP-008")
                .storeId(store1.getId())
                .serviceTypeId(stVip.getId())
                .serviceTypeName(stVip.getName())
                .customerName("Akshaya ")
                .customerPhone("+1 (555) 345-6789")
                .garmentCount(5)
                .status(TicketStatus.WAITING)
                .priorityLevel(3)
                .estimatedWaitMinutes(6)
                .peopleAhead(1)
                .joinedAt(now.minusMinutes(7))
                .build();

        QueueTicket ticketWait3 = QueueTicket.builder()
                .tokenNumber("TR-040")
                .storeId(store1.getId())
                .serviceTypeId(stStandard.getId())
                .serviceTypeName(stStandard.getName())
                .customerName("Krithii ")
                .customerPhone("+1 (555) 456-7890")
                .garmentCount(4)
                .status(TicketStatus.WAITING)
                .priorityLevel(1)
                .estimatedWaitMinutes(9)
                .peopleAhead(2)
                .joinedAt(now.minusMinutes(5))
                .build();

        QueueTicket ticketWait4 = QueueTicket.builder()
                .tokenNumber("TR-042")
                .storeId(store1.getId())
                .serviceTypeId(stStandard.getId())
                .serviceTypeName(stStandard.getName())
                .customerName("Kavitha")
                .customerPhone("+1 (555) 234-5678")
                .garmentCount(3)
                .status(TicketStatus.WAITING)
                .priorityLevel(1)
                .estimatedWaitMinutes(12)
                .peopleAhead(3)
                .joinedAt(now.minusMinutes(2))
                .build();

        // Completed Tickets
        QueueTicket ticketComp1 = QueueTicket.builder()
                .tokenNumber("TR-036")
                .storeId(store1.getId())
                .serviceTypeId(stStandard.getId())
                .serviceTypeName(stStandard.getName())
                .customerName("Rhenison ")
                .garmentCount(3)
                .status(TicketStatus.COMPLETED)
                .priorityLevel(1)
                .actualServiceDurationMinutes(7)
                .joinedAt(now.minusMinutes(45))
                .calledAt(now.minusMinutes(35))
                .serviceStartedAt(now.minusMinutes(33))
                .completedAt(now.minusMinutes(26))
                .build();

        QueueTicket ticketComp2 = QueueTicket.builder()
                .tokenNumber("TR-037")
                .storeId(store1.getId())
                .serviceTypeId(stStandard.getId())
                .serviceTypeName(stStandard.getName())
                .customerName("Gaurii ")
                .garmentCount(2)
                .status(TicketStatus.COMPLETED)
                .priorityLevel(1)
                .actualServiceDurationMinutes(5)
                .joinedAt(now.minusMinutes(38))
                .calledAt(now.minusMinutes(28))
                .serviceStartedAt(now.minusMinutes(26))
                .completedAt(now.minusMinutes(21))
                .build();

        queueTicketRepository.saveAll(Arrays.asList(
                ticketInService1, ticketInService2, ticketWait1, ticketWait2, ticketWait3, ticketWait4, ticketComp1, ticketComp2
        ));

        // Connect TrialRoom active IDs
        room1.setCurrentTicketId(ticketInService2.getId());
        room2.setCurrentTicketId(ticketInService1.getId());
        trialRoomRepository.saveAll(Arrays.asList(room1, room2));

        // 7. Feedbacks
        Feedback fb1 = Feedback.builder()
                .queueTicketId(ticketComp1.getId())
                .tokenNumber("TR-036")
                .storeId(store1.getId())
                .rating(5)
                .waitTimeSatisfaction(5)
                .staffHelpfulness(5)
                .roomCleanliness(5)
                .comment("Super smooth queue system! Loved browsing while waiting instead of standing in a crowded line.")
                .customerName("Rhenison ")
                .submittedAt(now.minusMinutes(25))
                .build();

        Feedback fb2 = Feedback.builder()
                .queueTicketId(ticketComp2.getId())
                .tokenNumber("TR-037")
                .storeId(store1.getId())
                .rating(5)
                .waitTimeSatisfaction(4)
                .staffHelpfulness(5)
                .roomCleanliness(5)
                .comment("The AI assistant answered my question about garment limits immediately. Very convenient!")
                .customerName("Aswathy")
                .submittedAt(now.minusMinutes(20))
                .build();

        feedbackRepository.saveAll(Arrays.asList(fb1, fb2));

        // 8. Audit Logs
        AuditLog al1 = AuditLog.builder().actorUsername("SYSTEM").actorRole("SYSTEM").action("SYSTEM_INIT").entityName("App").details("System seed data loaded").storeId(store1.getId()).timestamp(now.minusMinutes(60)).build();
        AuditLog al2 = AuditLog.builder().actorUsername("staff1").actorRole("STAFF").action("CALL_TICKET").entityName("QueueTicket").entityId("TR-038").details("Called customer Marcus Vance to Room 02").storeId(store1.getId()).timestamp(now.minusMinutes(12)).build();
        AuditLog al3 = AuditLog.builder().actorUsername("staff1").actorRole("STAFF").action("START_SERVICE").entityName("QueueTicket").entityId("EXP-019").details("Started express fitting in Room 01").storeId(store1.getId()).timestamp(now.minusMinutes(4)).build();
        auditLogRepository.saveAll(Arrays.asList(al1, al2, al3));

        log.info("Smart Trial Room Queue database initialized successfully!");
    }
}
