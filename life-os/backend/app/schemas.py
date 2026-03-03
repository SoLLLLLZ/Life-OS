from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models import TaskSource, TaskStatus


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

    class Config:
        from_attributes = True