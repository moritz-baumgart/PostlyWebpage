import { Gender } from "./gender";
import { Role } from "./role";

export interface UserFilterModel {
    username: string;
    roles: Role[];
    notRoles: Role[];
    genders: Gender[];
    notGenders: Gender[];
}