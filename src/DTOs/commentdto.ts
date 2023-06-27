import { UserDTO } from "./userdto";

export interface CommentDTO {
    id: number
    author: UserDTO
    createdAt: Date
    content: string
}