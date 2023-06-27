import { UserDTO } from "./userdto"
import { VoteType } from "./votetype"

export interface PostDTO {
    id: number
    content: string
    author: UserDTO
    createdAt: Date
    upvoteCount: number
    downvoteCount: number
    commentCount: number
    vote?: VoteType
    hasCommented?: boolean
}