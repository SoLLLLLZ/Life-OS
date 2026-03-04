from datetime import datetime, timezone
from pydantic import BaseModel, field_serializer
from typing import Optional
from app.models import TaskSource, TaskStatus


def to_utc_str(dt: Optional[datetime]) -> Optional[str]:
    """Always return ISO string with Z suffix so browsers parse as UTC."""
    if dt is None:
        return None
    # If naive (no tzinfo), assume it's already UTC
    if dt.tzinfo is None:
        return dt.strftime('%Y-%m-%dT%H:%M:%S') + 'Z'
    # If aware, convert to UTC first
    return dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S') + 'Z'


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    link_url: Optional[str] = None
    priority: Optional[int] = 0
    source: Optional[TaskSource] = TaskSource.manual


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    link_url: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[TaskStatus] = None


class TaskResponse(BaseModel):
    id: int
    user_id: int
    source: TaskSource
    title: str
    description: Optional[str]
    due_at: Optional[datetime]
    end_at: Optional[datetime]
    link_url: Optional[str]
    status: TaskStatus
    priority: int
    created_at: datetime
    updated_at: datetime

    @field_serializer('due_at', 'end_at', 'created_at', 'updated_at')
    def serialize_dt(self, dt: Optional[datetime]) -> Optional[str]:
        return to_utc_str(dt)

    class Config:
        from_attributes = True