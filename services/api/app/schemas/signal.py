from pydantic import BaseModel, Field


class SignalScore(BaseModel):
    score: int = Field(ge=0, le=100)
    level: str
    reasons: list[str]
