import { UserDTO } from "./userdto"
import { VoteType } from "./votetype"

export interface PostDTO {
    id: number
    content: string
    author: UserDTO
    createdAt: Date
    attachedImageUrl: string | null
    upvoteCount: number
    downvoteCount: number
    commentCount: number
    vote: VoteType | null
    hasCommented: boolean | null
}