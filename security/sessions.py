"""
Session Management - Stateful Session Handling

For Cloudflare deployment, sessions are stored in KV with TTL.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import time
import secrets
import logging

logger = logging.getLogger(__name__)


@dataclass
class Session:
    """A user session"""
    session_id: str
    key_id: str
    owner_id: str
    
    # Session state
    created_at: float = field(default_factory=time.time)
    expires_at: float = field(default_factory=lambda: time.time() + 3600)
    last_activity: float = field(default_factory=time.time)
    
    # Session data
    data: Dict[str, Any] = field(default_factory=dict)
    
    # Request tracking
    request_count: int = 0
    
    def is_expired(self) -> bool:
        return time.time() > self.expires_at
    
    def touch(self):
        """Update last activity time"""
        self.last_activity = time.time()
        self.request_count += 1
    
    def to_dict(self) -> Dict:
        return {
            "session_id": self.session_id,
            "key_id": self.key_id,
            "owner_id": self.owner_id,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
            "last_activity": self.last_activity,
            "data": self.data,
            "request_count": self.request_count,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Session":
        return cls(
            session_id=data["session_id"],
            key_id=data["key_id"],
            owner_id=data["owner_id"],
            created_at=data.get("created_at", time.time()),
            expires_at=data.get("expires_at", time.time() + 3600),
            last_activity=data.get("last_activity", time.time()),
            data=data.get("data", {}),
            request_count=data.get("request_count", 0),
        )


class SessionManager:
    """
    Manages user sessions.
    
    In Cloudflare deployment, this uses KV storage with TTL.
    """
    
    def __init__(self, storage=None, default_ttl: int = 3600):
        self._sessions: Dict[str, Session] = {}
        self._storage = storage  # Cloudflare KV adapter
        self._default_ttl = default_ttl
    
    async def create_session(
        self,
        key_id: str,
        owner_id: str,
        ttl: Optional[int] = None,
        data: Dict[str, Any] = None,
    ) -> Session:
        """Create a new session"""
        ttl = ttl or self._default_ttl
        
        session = Session(
            session_id=f"sess_{secrets.token_hex(16)}",
            key_id=key_id,
            owner_id=owner_id,
            expires_at=time.time() + ttl,
            data=data or {},
        )
        
        self._sessions[session.session_id] = session
        
        if self._storage:
            await self._storage.set(
                session.session_id,
                session.to_dict(),
                ttl=ttl,
            )
        
        logger.debug(f"Created session: {session.session_id}")
        return session
    
    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID"""
        # Check cache
        if session_id in self._sessions:
            session = self._sessions[session_id]
            if not session.is_expired():
                return session
            else:
                del self._sessions[session_id]
        
        # Check storage
        if self._storage:
            data = await self._storage.get(session_id)
            if data:
                session = Session.from_dict(data)
                if not session.is_expired():
                    self._sessions[session_id] = session
                    return session
        
        return None
    
    async def touch_session(self, session_id: str) -> bool:
        """Update session activity"""
        session = await self.get_session(session_id)
        if not session:
            return False
        
        session.touch()
        
        if self._storage:
            remaining_ttl = int(session.expires_at - time.time())
            if remaining_ttl > 0:
                await self._storage.set(
                    session.session_id,
                    session.to_dict(),
                    ttl=remaining_ttl,
                )
        
        return True
    
    async def extend_session(self, session_id: str, extra_ttl: int = None) -> bool:
        """Extend session expiration"""
        session = await self.get_session(session_id)
        if not session:
            return False
        
        extra_ttl = extra_ttl or self._default_ttl
        session.expires_at = time.time() + extra_ttl
        session.touch()
        
        if self._storage:
            await self._storage.set(
                session.session_id,
                session.to_dict(),
                ttl=extra_ttl,
            )
        
        return True
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        if session_id in self._sessions:
            del self._sessions[session_id]
        
        if self._storage:
            await self._storage.delete(session_id)
        
        logger.debug(f"Deleted session: {session_id}")
        return True
    
    async def set_session_data(self, session_id: str, key: str, value: Any) -> bool:
        """Set a value in session data"""
        session = await self.get_session(session_id)
        if not session:
            return False
        
        session.data[key] = value
        
        if self._storage:
            remaining_ttl = int(session.expires_at - time.time())
            if remaining_ttl > 0:
                await self._storage.set(
                    session.session_id,
                    session.to_dict(),
                    ttl=remaining_ttl,
                )
        
        return True
    
    async def get_session_data(self, session_id: str, key: str) -> Optional[Any]:
        """Get a value from session data"""
        session = await self.get_session(session_id)
        if not session:
            return None
        
        return session.data.get(key)
    
    async def list_sessions(self, owner_id: Optional[str] = None) -> List[Session]:
        """List active sessions"""
        sessions = [s for s in self._sessions.values() if not s.is_expired()]
        
        if owner_id:
            sessions = [s for s in sessions if s.owner_id == owner_id]
        
        return sessions
    
    async def cleanup_expired(self) -> int:
        """Remove expired sessions from cache"""
        expired = [
            sid for sid, session in self._sessions.items()
            if session.is_expired()
        ]
        
        for sid in expired:
            del self._sessions[sid]
        
        return len(expired)


# Global session manager
_manager: Optional[SessionManager] = None


def get_session_manager() -> SessionManager:
    """Get or create global session manager"""
    global _manager
    if _manager is None:
        _manager = SessionManager()
    return _manager
