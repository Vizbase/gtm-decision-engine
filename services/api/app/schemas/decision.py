from enum import Enum

from pydantic import BaseModel


class RecommendedAction(str, Enum):
    WORK_NOW = "work_now"
    RESEARCH_FIRST = "research_first"
    NURTURE = "nurture"
    DEPRIORITIZE = "deprioritize"

    FOLLOW_UP_EXISTING = "follow_up_existing"
    EXPANSION = "expansion"
    CONTINUE_OPPORTUNITY = "continue_opportunity"
    PAUSE_OUTREACH = "pause_outreach"


class DecisionResult(BaseModel):
    recommended_action: RecommendedAction
    action_reason: str
