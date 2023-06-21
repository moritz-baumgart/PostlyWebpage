import { Role } from "./role";
import { Gender } from "./gender";

export interface UserDataUpdateRequest {
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    birthday: Date | null;
    gender: Gender | null;
}