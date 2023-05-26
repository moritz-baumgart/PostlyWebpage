import { AuthorDTO } from "./authordto";

export interface CommentDTO {
    id: number
    author: AuthorDTO
    createdAt: Date
    content: string
}