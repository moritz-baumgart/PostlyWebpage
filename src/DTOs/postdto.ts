import { AuthorDTO } from "./authordto"

export interface PostDTO {
    id: number
    content: string
    author: AuthorDTO
    createdAt: Date
    upvoteCount: number
    downvoteCount: number
    commentCount: number
}