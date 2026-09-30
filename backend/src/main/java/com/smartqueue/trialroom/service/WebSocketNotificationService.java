package com.smartqueue.trialroom.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastStoreQueueUpdate(Long storeId, Object payload) {
        try {
            messagingTemplate.convertAndSend("/topic/queue/" + storeId, payload);
            messagingTemplate.convertAndSend("/topic/queue/all", payload);
            log.debug("Sent WS queue update for store {}", storeId);
        } catch (Exception e) {
            log.error("Failed to broadcast store queue update: {}", e.getMessage());
        }
    }

    public void broadcastTicketUpdate(String tokenNumber, Object payload) {
        try {
            messagingTemplate.convertAndSend("/topic/ticket/" + tokenNumber, payload);
            log.debug("Sent WS ticket update for token {}", tokenNumber);
        } catch (Exception e) {
            log.error("Failed to broadcast ticket update: {}", e.getMessage());
        }
    }

    public void broadcastPublicDisplay(String storeCode, Object payload) {
        try {
            messagingTemplate.convertAndSend("/topic/public/" + storeCode, payload);
        } catch (Exception e) {
            log.error("Failed to broadcast public display update: {}", e.getMessage());
        }
    }

    public void broadcastAdminStats(Object payload) {
        try {
            messagingTemplate.convertAndSend("/topic/admin/stats", payload);
        } catch (Exception e) {
            log.error("Failed to broadcast admin stats: {}", e.getMessage());
        }
    }
}
