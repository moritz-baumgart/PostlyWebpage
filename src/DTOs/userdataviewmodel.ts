import { Role } from "./role";
import { Gender } from "./gender";

export interface UserDataViewModel {
    // Public:
    id: number;
    createdAt: Date;
    username: string;
    displayName: string | null;
    role: Role;
    birthday: Date | null;
    gender: Gender | null;
    profileImageUrl: string | null;
    // Private:
    email: string | null;
    phoneNumber: string | null;
}