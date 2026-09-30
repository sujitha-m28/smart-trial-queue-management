package com.smartqueue.trialroom.controller;

import com.smartqueue.trialroom.dto.StoreDtos.ServiceTypeDto;
import com.smartqueue.trialroom.dto.StoreDtos.StoreDto;
import com.smartqueue.trialroom.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class StorePublicController {

    private final StoreService storeService;

    @GetMapping("/api/stores")
    public ResponseEntity<List<StoreDto>> getAllStores() {
        return ResponseEntity.ok(storeService.getAllStores());
    }

    @GetMapping("/api/stores/{id}")
    public ResponseEntity<StoreDto> getStoreById(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.getStoreById(id));
    }

    @GetMapping("/api/stores/code/{code}")
    public ResponseEntity<StoreDto> getStoreByCode(@PathVariable String code) {
        return ResponseEntity.ok(storeService.getStoreByCode(code));
    }

    @GetMapping("/api/service-types")
    public ResponseEntity<List<ServiceTypeDto>> getServiceTypes() {
        return ResponseEntity.ok(storeService.getAllServiceTypes());
    }
}
