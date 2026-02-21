"""multi platform support

Revision ID: a1b2c3d4e5f6
Revises: 7a51c5df4f29
Create Date: 2026-02-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "7a51c5df4f29"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename columns
    op.alter_column("videos", "tweet_url", new_column_name="url")
    op.alter_column("videos", "tweet_id", new_column_name="external_id")

    # Add platform column with default for existing data
    op.add_column(
        "videos",
        sa.Column("platform", sa.String(20), nullable=False, server_default="x"),
    )
    op.create_index("ix_videos_platform", "videos", ["platform"])


def downgrade() -> None:
    op.drop_index("ix_videos_platform", table_name="videos")
    op.drop_column("videos", "platform")
    op.alter_column("videos", "url", new_column_name="tweet_url")
    op.alter_column("videos", "external_id", new_column_name="tweet_id")
