import { JoinRoomDto } from "@/modules/rooms/dto/join-room.dto";
import { IsInt, IsOptional, Min } from "class-validator";

export class RoomJoinEventDto extends JoinRoomDto {
  @IsInt()
  @Min(1)
  roomId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;
}
