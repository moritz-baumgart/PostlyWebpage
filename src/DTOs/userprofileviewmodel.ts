import { Role } from "./role";
import { Gender } from "./gender";

export interface UserProfileViewModel {
    id: number;
    createdAt: string;
    username: string;
    displayName: string;
    role: Role;
    followerCount: number;
    followingCount: number;
    birthday: string | null;
    gender: Gender | null;
    follow: boolean | null
}