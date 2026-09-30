package com.smartqueue.trialroom.service;

import com.smartqueue.trialroom.dto.FeedbackDtos.*;
import com.smartqueue.trialroom.entity.Feedback;
import com.smartqueue.trialroom.entity.QueueTicket;
import com.smartqueue.trialroom.repository.FeedbackRepository;
import com.smartqueue.trialroom.repository.QueueTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final QueueTicketRepository queueTicketRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public FeedbackDto submitFeedback(FeedbackRequest request, String customerUsername) {
        QueueTicket ticket = queueTicketRepository.findById(request.getQueueTicketId())
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + request.getQueueTicketId()));

        Feedback feedback = Feedback.builder()
                .queueTicketId(ticket.getId())
                .tokenNumber(ticket.getTokenNumber())
                .storeId(ticket.getStoreId())
                .rating(request.getRating() != null ? request.getRating() : 5)
                .waitTimeSatisfaction(request.getWaitTimeSatisfaction() != null ? request.getWaitTimeSatisfaction() : 5)
                .staffHelpfulness(request.getStaffHelpfulness() != null ? request.getStaffHelpfulness() : 5)
                .roomCleanliness(request.getRoomCleanliness() != null ? request.getRoomCleanliness() : 5)
                .comment(request.getComment())
                .customerName(ticket.getCustomerName())
                .build();

        feedback = feedbackRepository.save(feedback);
        auditLogService.log(
                customerUsername != null ? customerUsername : ticket.getCustomerName(),
                "CUSTOMER",
                "SUBMIT_FEEDBACK",
                "Feedback",
                feedback.getId().toString(),
                "Rated " + feedback.getRating() + " stars for token " + ticket.getTokenNumber(),
                ticket.getStoreId()
        );

        return mapToDto(feedback);
    }

    public List<FeedbackDto> getFeedbacksByStore(Long storeId) {
        return feedbackRepository.findByStoreIdOrderBySubmittedAtDesc(storeId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<FeedbackDto> getAllFeedbacks() {
        return feedbackRepository.findAllByOrderBySubmittedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private FeedbackDto mapToDto(Feedback f) {
        return FeedbackDto.builder()
                .id(f.getId())
                .queueTicketId(f.getQueueTicketId())
                .tokenNumber(f.getTokenNumber())
                .storeId(f.getStoreId())
                .rating(f.getRating())
                .waitTimeSatisfaction(f.getWaitTimeSatisfaction())
                .staffHelpfulness(f.getStaffHelpfulness())
                .roomCleanliness(f.getRoomCleanliness())
                .comment(f.getComment())
                .customerName(f.getCustomerName())
                .submittedAt(f.getSubmittedAt())
                .build();
    }
}
