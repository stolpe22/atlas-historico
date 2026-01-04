from .events import router as events_router
from .populate import router as populate_router
from .kaggle import router as kaggle_router
from .settings import router as settings_router

__all__ = ['events_router', 'populate_router','kaggle_router', 'settings_router']