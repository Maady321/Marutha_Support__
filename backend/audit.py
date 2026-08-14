import uuid
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models import AuditLog

async def log_audit(
    db: AsyncSession,
    user_id: Optional[uuid.UUID],
    action: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    metadata: Optional[Any] = None
):
    log = AuditLog(
        userId=user_id,
        action=action,
        ipAddress=ip_address,
        userAgent=user_agent,
        metadata_=metadata
    )
    db.add(log)
    await db.flush()
