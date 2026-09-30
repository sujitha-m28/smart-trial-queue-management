package com.smartqueue.trialroom.controller;

import com.smartqueue.trialroom.dto.FeedbackDtos.*;
import com.smartqueue.trialroom.entity.User;
import com.smartqueue.trialroom.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final FeedbackService feedbackService;

    @PostMapping("/feedback")
    public ResponseEntity<FeedbackDto> submitFeedback(
            @Valid @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "CUSTOMER";
        return ResponseEntity.ok(feedbackService.submitFeedback(request, username));
    }
}
