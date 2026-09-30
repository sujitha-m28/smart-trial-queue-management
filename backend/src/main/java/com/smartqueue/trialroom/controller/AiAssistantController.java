package com.smartqueue.trialroom.controller;

import com.smartqueue.trialroom.dto.AiAssistantDtos.ChatRequest;
import com.smartqueue.trialroom.dto.AiAssistantDtos.ChatResponse;
import com.smartqueue.trialroom.service.AiAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        return ResponseEntity.ok(aiAssistantService.processChat(request));
    }
}
