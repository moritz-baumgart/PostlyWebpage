import { AuthorDTO } from "./authordto"
import { VoteType } from "./votetype"

export interface PostDTO {
    id: number
    content: string
    author: AuthorDTO
    createdAt: Date
    upvoteCount: number
    downvoteCount: number
    commentCount: number
    vote?: VoteType
    hasCommented?: boolean
}