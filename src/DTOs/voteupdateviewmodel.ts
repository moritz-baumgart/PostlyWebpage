import { VoteType } from "./votetype";

export interface VoteUpdateViewModel {
    postId: number;
    upvoteCount: number;
    downvoteCount: number;
    userId: number;
    voteType: VoteType | null;
}
