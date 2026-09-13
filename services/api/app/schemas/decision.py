from enum import Enum
from pydantic import BaseModel


class RecommendedAction(str, Enum):
    WORK_NOW = "work_now"
    RESEARCH_FIRST = "research_first"
    NURTURE = "nurture"
    DEPRIORITIZE = "deprioritize"


class DecisionResult(BaseModel):
    recommended_action: RecommendedAction
    action_reason: str
