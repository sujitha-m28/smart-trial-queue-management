package com.smartqueue.trialroom.service;

import com.smartqueue.trialroom.dto.StoreDtos.TrialRoomDto;
import com.smartqueue.trialroom.entity.RoomStatus;
import com.smartqueue.trialroom.entity.TrialRoom;
import com.smartqueue.trialroom.repository.TrialRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrialRoomService {

    private final TrialRoomRepository trialRoomRepository;
    private final AuditLogService auditLogService;

    public List<TrialRoomDto> getRoomsByStore(Long storeId) {
        return trialRoomRepository.findByStoreId(storeId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<TrialRoomDto> getActiveRoomsByStore(Long storeId) {
        return trialRoomRepository.findByStoreIdAndActiveTrue(storeId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TrialRoomDto updateRoomStatus(Long roomId, RoomStatus status, String username) {
        TrialRoom room = trialRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found with ID: " + roomId));
        room.setStatus(status);
        if (status == RoomStatus.AVAILABLE || status == RoomStatus.CLEANING || status == RoomStatus.MAINTENANCE) {
            room.setCurrentTicketId(null);
            room.setCurrentTokenNumber(null);
        }
        room = trialRoomRepository.save(room);
        auditLogService.log(username, "STAFF", "UPDATE_ROOM_STATUS", "TrialRoom", roomId.toString(), "Set status to " + status, room.getStoreId());
        return mapToDto(room);
    }

    @Transactional
    public TrialRoomDto createRoom(TrialRoomDto dto, String username) {
        TrialRoom room = TrialRoom.builder()
                .storeId(dto.getStoreId())
                .roomNumber(dto.getRoomNumber())
                .roomType(dto.getRoomType() != null ? dto.getRoomType() : "REGULAR")
                .status(RoomStatus.AVAILABLE)
                .active(true)
                .build();
        room = trialRoomRepository.save(room);
        auditLogService.log(username, "ADMIN", "CREATE_ROOM", "TrialRoom", room.getId().toString(), "Created room " + room.getRoomNumber(), room.getStoreId());
        return mapToDto(room);
    }

    private TrialRoomDto mapToDto(TrialRoom room) {
        return TrialRoomDto.builder()
                .id(room.getId())
                .storeId(room.getStoreId())
                .roomNumber(room.getRoomNumber())
                .roomType(room.getRoomType())
                .status(room.getStatus())
                .currentTicketId(room.getCurrentTicketId())
                .currentTokenNumber(room.getCurrentTokenNumber())
                .active(room.isActive())
                .build();
    }
}
