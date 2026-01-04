from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum


class EventSourceEnum(str, Enum):
    manual = "manual"
    wikidata = "wikidata"
    seed = "seed"


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class EventCreate(BaseModel):
    """Schema para criação de evento."""
    name: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., max_length=1000)
    content: Optional[str] = None
    year_start: int = Field(..., ge=-10000, le=2100)
    year_end: Optional[int] = Field(None, ge=-10000, le=2100)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    continent: Optional[str] = None
    period: Optional[str] = None
    source: EventSourceEnum = EventSourceEnum.manual

    @field_validator('year_end')
    @classmethod
    def validate_year_end(cls, v:  Optional[int], info) -> Optional[int]:
        if v is not None and 'year_start' in info.data:
            if v < info.data['year_start']:
                raise ValueError('year_end deve ser >= year_start')
        return v


class PopulateOptions(BaseModel):
    """Schema para configuração de população."""
    mode: str = "fast"
    continents: List[str] = Field(..., min_length=1)
    start_year: int = Field(..., ge=-10000, le=2100)
    end_year: int = Field(..., ge=-10000, le=2100)

    @field_validator('end_year')
    @classmethod
    def validate_end_year(cls, v: int, info) -> int:
        if 'start_year' in info.data and v < info.data['start_year']: 
            raise ValueError('end_year deve ser >= start_year')
        return v


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class EventResponse(BaseModel):
    """Schema de resposta para evento."""
    id: int
    name:  str
    description:  str
    content:  Optional[str]
    year_start: int
    year_end: Optional[int]
    continent: Optional[str]
    period: Optional[str]
    source: Optional[str]
    latitude: float
    longitude: float

    class Config: 
        from_attributes = True


class EventGeoFeature(BaseModel):
    """Feature GeoJSON de um evento."""
    type: str = "Feature"
    geometry: dict
    properties: dict


class EventGeoCollection(BaseModel):
    """FeatureCollection GeoJSON."""
    type: str = "FeatureCollection"
    features: List[EventGeoFeature]


class StatusResponse(BaseModel):
    """Status de operação."""
    status: str
    message: Optional[str] = None
    id: Optional[int] = None


class PopulationStatus(BaseModel):
    """Status da população."""
    is_running: bool
    message: str