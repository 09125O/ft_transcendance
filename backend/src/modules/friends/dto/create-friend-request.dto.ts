import { IsInt, Min } from "class-validator";

export class CreateFriendRequestDto {
  @IsInt()
  @Min(1)
  receiverUserId: number;
}
