import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from gradescopeapi.classes.connection import GSConnection

from app.config import settings
from app.models import User, Task, TaskSource, TaskStatus

logger = logging.getLogger(__name__)


def sync_gradescope(user: User, db: Session) -> int:
    try:
        connection = GSConnection()
        connection.login(settings.gradescope_email, settings.gradescope_password)
    except Exception as e:
        logger.error(f"Gradescope login failed: {e}")
        return 0

    count = 0

    try:
        courses = connection.account.get_courses()
    except Exception as e:
        logger.error(f"Could not fetch Gradescope courses: {e}")
        return 0

    student_courses = courses.get("student", {})

    for course_id, course in student_courses.items():
        # Try every possible attribute for course code
        course_name = f"{course.name} - {course.full_name}" if hasattr(course, 'full_name') and course.full_name else str(course_id)

        try:
            assignments = connection.account.get_assignments(course_id)
        except Exception as e:
            logger.warning(f"Could not fetch assignments for course {course_name}: {e}")
            continue

        if not assignments:
            continue

        for assignment in assignments:
            try:
                assignment_id = str(assignment.aid) if hasattr(assignment, 'aid') else None
                title = assignment.name if hasattr(assignment, 'name') else "Unknown Assignment"
                due_at = assignment.due_date if hasattr(assignment, 'due_date') else None

                # Fix 1: handle timezone-aware vs naive datetime comparison
                if due_at and isinstance(due_at, datetime):
                    now = datetime.now(timezone.utc) if due_at.tzinfo else datetime.now()
                    if due_at < now:
                        continue

                link_url = f"https://www.gradescope.com/courses/{course_id}"
                if assignment_id:
                    link_url += f"/assignments/{assignment_id}"

                # Fix 2: use assignment_id only as source_id to avoid duplicates
                source_id = f"gradescope_{assignment_id}"

                existing = db.execute(
                    select(Task).where(
                        Task.user_id == user.id,
                        Task.source_id == source_id
                    )
                ).scalar_one_or_none()

                full_title = f"[{course_name}] {title}"

                if existing:
                    existing.title = full_title
                    existing.due_at = due_at
                    existing.link_url = link_url
                else:
                    task = Task(
                        user_id=user.id,
                        source=TaskSource.gradescope,
                        source_id=source_id,
                        title=full_title,
                        description=f"Course: {course_name}",
                        due_at=due_at,
                        link_url=link_url,
                        status=TaskStatus.pending,
                    )
                    db.add(task)
                    count += 1

            except Exception as e:
                logger.warning(f"Could not process assignment: {e}")
                continue

    db.commit()
    logger.info(f"Synced {count} new Gradescope assignments for user {user.email}")
    return count