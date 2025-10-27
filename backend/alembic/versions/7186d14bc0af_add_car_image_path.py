"""add_car_image_path

Revision ID: 7186d14bc0af
Revises: e1594dc2674a
Create Date: 2025-10-27 08:22:07.215554

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7186d14bc0af'
down_revision: Union[str, None] = 'e1594dc2674a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add image_path column to cars table
    op.add_column('cars', sa.Column('image_path', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove image_path column from cars table
    op.drop_column('cars', 'image_path')
