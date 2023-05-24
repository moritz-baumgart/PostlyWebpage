import { AuthorDTO } from "./authordto"
import { VoteInteractionType } from "./voteinteractiontype"

export interface PostDTO {
    id: number
    content: string
    author: AuthorDTO
    createdAt: Date
    upvoteCount: number
    downvoteCount: number
    commentCount: number
    vote?: VoteInteractionType
    hasCommented?: boolean
}