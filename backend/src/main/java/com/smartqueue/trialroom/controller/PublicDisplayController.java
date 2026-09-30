package com.smartqueue.trialroom.controller;

import com.smartqueue.trialroom.dto.QueueDtos.PublicDisplayDto;
import com.smartqueue.trialroom.service.QueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicDisplayController {

    private final QueueService queueService;

    @GetMapping("/display/{storeCode}")
    public ResponseEntity<PublicDisplayDto> getPublicDisplay(@PathVariable String storeCode) {
        return ResponseEntity.ok(queueService.getPublicDisplayData(storeCode));
    }
}
