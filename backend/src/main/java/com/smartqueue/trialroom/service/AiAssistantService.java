package com.smartqueue.trialroom.service;

import com.smartqueue.trialroom.dto.AiAssistantDtos.*;
import com.smartqueue.trialroom.entity.QueueTicket;
import com.smartqueue.trialroom.entity.Store;
import com.smartqueue.trialroom.repository.QueueTicketRepository;
import com.smartqueue.trialroom.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiAssistantService {

    private final QueueTicketRepository queueTicketRepository;
    private final StoreRepository storeRepository;
    private final QueueService queueService;

    public ChatResponse processChat(ChatRequest request) {
        String msg = request.getMessage() != null ? request.getMessage().trim().toLowerCase() : "";
        String token = request.getTokenNumber();

        QueueTicket ticket = null;
        if (token != null && !token.isBlank()) {
            ticket = queueTicketRepository.findByTokenNumber(token).orElse(null);
        }

        String reply;
        String intent;
        List<String> quickActions = new ArrayList<>();
        Integer remainingWait = null;

        if (ticket != null) {
            remainingWait = ticket.getEstimatedWaitMinutes();
        }

        // AI Intent & Response Determination
        if (msg.contains("wait") || msg.contains("how long") || msg.contains("time") || msg.contains("position") || msg.contains("turn")) {
            intent = "WAIT_TIME_QUERY";
            if (ticket != null) {
                int peopleAhead = (int) queueTicketRepository.countPeopleAhead(ticket.getStoreId(), ticket.getPriorityLevel(), ticket.getJoinedAt());
                int est = queueService.calculateEstimatedWaitTime(ticket.getStoreId(), peopleAhead, ticket.getGarmentCount(), null);
                remainingWait = est;

                reply = String.format(
                        "👋 Hello %s! For your token **%s**:\n\n" +
                        "• **People ahead:** %d customer(s)\n" +
                        "• **Estimated wait:** ~%d minutes\n" +
                        "• **Garments registered:** %d item(s)\n\n" +
                        "You can comfortably browse nearby sections! We will alert your screen and chime when your room is ready.",
                        ticket.getCustomerName(), ticket.getTokenNumber(), peopleAhead, est, ticket.getGarmentCount()
                );
            } else {
                reply = "Your current average trial room wait is approximately 8-12 minutes. If you have an active digital token, share your token number (e.g. TR-042) to get exact real-time tracking!";
            }
            quickActions = Arrays.asList("Refresh Queue Position", "Store Item Limits", "Need Assistance");

        } else if (msg.contains("limit") || msg.contains("how many") || msg.contains("garment") || msg.contains("clothes") || msg.contains("pieces") || msg.contains("item")) {
            intent = "GARMENT_LIMIT";
            reply = "👗 **Trial Room Policy:**\n\n" +
                    "• **Standard Rooms:** Up to 6 garments per session.\n" +
                    "• **Express Line:** Up to 2 garments for super-fast fitting (< 4 min wait).\n" +
                    "• **VIP Styling Suites:** Up to 10 garments with personal assistant support.\n\n" +
                    "Need to try more? You can do multiple quick sessions or ask staff at the fitting desk!";
            quickActions = Arrays.asList("Check My Token", "VIP Room Info", "Where is the mirror?");

        } else if (msg.contains("size") || msg.contains("different size") || msg.contains("exchange") || msg.contains("help") || msg.contains("assist") || msg.contains("staff")) {
            intent = "ASSISTANCE_REQUEST";
            reply = "🛎️ **In-Room Assistant Service:**\n\n" +
                    "Need a different size or color while trying on clothes? Once you enter your trial room, you can tap **'Request Staff Assistance'** on your phone screen or let the fitting attendant outside know your item tag, and our team will bring the right size directly to your door!";
            quickActions = Arrays.asList("Request Staff Now", "Check Wait Time", "Cancel Queue");

        } else if (msg.contains("cancel") || msg.contains("leave") || msg.contains("exit")) {
            intent = "CANCEL_QUERY";
            reply = "You can cancel your queue position anytime by tapping the red **[Cancel Queue]** button on your ticket card. If you change your mind later, you can scan the QR code again in seconds!";
            quickActions = Arrays.asList("Cancel My Queue", "Keep My Spot");

        } else if (msg.contains("policy") || msg.contains("rule") || msg.contains("shoe") || msg.contains("hour") || msg.contains("open")) {
            intent = "STORE_POLICY";
            reply = "🏢 **Store & Fitting Guidelines:**\n\n" +
                    "• Open daily: 10:00 AM – 10:00 PM\n" +
                    "• Sanitized rooms after every use\n" +
                    "• Dedicated footwear and hooks available inside\n" +
                    "• Please return hangers and unwanted items to the return rack outside\n" +
                    "• Digital queue ensures a fair first-come, first-served experience without standing in line!";
            quickActions = Arrays.asList("Check Wait Time", "Garment Limits", "Join Queue");

        } else {
            intent = "GENERAL";
            reply = "👋 Hi there! I'm your **Smart Trial Room AI Assistant**.\n\n" +
                    "I can help you with:\n" +
                    "• ⏱️ Real-time wait times & queue position\n" +
                    "• 👗 Garment limits and express fitting options\n" +
                    "• 🏷️ In-room size exchange requests\n" +
                    "• 📍 Store hours and trial room policies\n\n" +
                    "How can I assist your shopping experience today?";
            quickActions = Arrays.asList("How long is my wait?", "Garment limits?", "Request Size Help");
        }

        return ChatResponse.builder()
                .reply(reply)
                .intent(intent)
                .quickActions(quickActions)
                .estimatedRemainingMinutes(remainingWait)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
