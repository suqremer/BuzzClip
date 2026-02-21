from app.models.video import Video
from app.schemas.user import UserBriefResponse
from app.schemas.video import CategoryResponse, VideoResponse


def video_to_response(video: Video, user_voted: bool = False, is_trending: bool = False) -> VideoResponse:
    return VideoResponse(
        id=video.id,
        tweet_url=video.tweet_url,
        tweet_id=video.tweet_id,
        author_name=video.author_name,
        author_url=video.author_url,
        oembed_html=video.oembed_html,
        title=video.title,
        categories=[
            CategoryResponse(
                id=c.id, slug=c.slug, name_ja=c.name_ja, icon=c.icon
            )
            for c in video.categories
        ],
        vote_count=video.vote_count,
        user_voted=user_voted,
        is_trending=is_trending,
        submitted_by=UserBriefResponse(
            id=video.submitter.id,
            display_name=video.submitter.display_name,
            avatar_url=video.submitter.avatar_url,
        ) if video.submitter else None,
        created_at=video.created_at,
    )
