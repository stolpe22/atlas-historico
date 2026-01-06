from .events import router as events_router
from .populate import router as populate_router
from .settings import router as settings_router
from .etl import router as etl_router
from .docs import router as docs_router

__all__ = ['events_router', 'populate_router','etl_router', 'settings_router', 'docs_router']